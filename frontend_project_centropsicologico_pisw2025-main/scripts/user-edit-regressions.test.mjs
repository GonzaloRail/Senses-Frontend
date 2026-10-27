import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
async function load(entry, source) {
  const result = await build({
    absWorkingDir: projectRoot,
    ...(source ? { stdin: { contents: source, loader: "tsx", resolveDir: projectRoot } } : { entryPoints: [entry] }),
    bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent",
    plugins: [{
      name: "office-catalog",
      setup(builder) {
        builder.onResolve({ filter: /^@\/features\/offices\/hooks\/useOfficesQueries$/ }, () => ({ path: "catalog", namespace: "mock" }));
        builder.onResolve({ filter: /^@\/shared\/components\/SearchableSelect$/ }, () => ({ path: "select", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
          contents: path === "catalog"
            ? "export const useOfficesSearchQuery=()=>({offices:[],isLoading:false,error:null,setNameQuery:()=>{}})"
            : 'import React from "react";export function SearchableSelect(props){globalThis.userEditSelectProps=props;return React.createElement("span",null,props.options.find(x=>x.value===props.value)?.label??"missing")}',
          loader: "js", resolveDir: projectRoot,
        }));
      },
    }],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const { createUserFormSchema, userFormSchema } = await load("src/shared/interfaces/forms/UserFormSchema.ts");
const policy = await load("src/features/systemUsers/utils/userEditPolicy.ts");
const office = await load("src/features/systemUsers/utils/scheduleOffice.ts");
const base = () => ({
  firstName: "Prueba", lastName: "Usuario", email: "prueba@example.invalid", dni: "00000003",
  roles: ["PSYCHOLOGIST"],
  workSchedule: [{ day: "TUESDAY", fromHour: "09", fromMinute: "30", toHour: "13", toMinute: "15", officeId: "office-1" }],
});

test("temporary exception applies only to existing users, while creation stays strict", () => {
  assert.equal(policy.requiresUserDocuments("existing-id"), false);
  assert.equal(policy.requiresUserDocuments(), true);
  assert.equal(policy.requiresUserDocuments(""), true);
  assert.equal(createUserFormSchema({ requireDocuments: policy.requiresUserDocuments("existing-id") }).safeParse(base()).success, true);
  const create = userFormSchema.safeParse(base());
  assert.equal(create.success, false);
  assert.deepEqual(create.error.issues.map((issue) => issue.path[0]).sort(), ["certificate", "cv", "title"]);
});

test("creation still requires documentation for admission and accepts existing document URLs", () => {
  const admission = userFormSchema.safeParse({ ...base(), roles: ["ADMISSION"] });
  assert.equal(admission.success, false);
  assert.deepEqual(admission.error.issues.map((issue) => issue.path[0]).sort(), ["cv", "mentalHealthCertificate"]);
  assert.equal(userFormSchema.safeParse({ ...base(), cv: "https://example.invalid/cv.pdf",
    title: "https://example.invalid/title.pdf", certificate: "https://example.invalid/certificate.pdf" }).success, true);
});

test("the exception can be disabled and retains name, role and office validation", () => {
  assert.equal(createUserFormSchema({ requireDocuments: true }).safeParse(base()).success, false);
  const edit = createUserFormSchema({ requireDocuments: false });
  assert.equal(edit.safeParse({ ...base(), firstName: "" }).success, false);
  assert.equal(edit.safeParse({ ...base(), roles: [] }).success, false);
  assert.equal(edit.safeParse({ ...base(), roles: ["ADMIN", "INTERNAL"] }).success, false);
  assert.equal(edit.safeParse({ ...base(), workSchedule: [{ ...base().workSchedule[0], officeId: "" }] }).success, false);
});

test("office id resolves both backend contracts and never guesses an assignment", () => {
  assert.equal(office.resolveScheduleOfficeId({ office: { id: "nested", name: "101" } }), "nested");
  assert.equal(office.resolveScheduleOfficeId({ officeId: "flat" }), "flat");
  assert.equal(office.resolveScheduleOfficeId({ officeId: "", office: { id: "nested" } }), "nested");
  assert.equal(office.resolveScheduleOfficeId({}), "");
});

test("saved office survives empty or filtered catalogs without duplicates", () => {
  const saved = office.getAssignedOfficeOptions([{ office: { id: "1", name: "Consultorio 101" } },
    { officeId: "1", office: { id: "1", name: "Consultorio 101" } }]);
  assert.equal(saved.length, 1);
  assert.deepEqual(office.mergeScheduleOfficeOptions(saved, []), saved);
  assert.equal(office.mergeScheduleOfficeOptions(saved, [{ value: "2", label: "202" }]).length, 2);
  assert.deepEqual(office.mergeScheduleOfficeOptions(saved, [{ value: "1", label: "Nombre actualizado" }]),
    [{ value: "1", label: "Nombre actualizado" }]);
});

const ui = await load(null, `
  import React from "react";
  import { renderToString } from "react-dom/server";
  import { FormProvider, useForm, useFieldArray } from "react-hook-form";
  import { UserWorkSchedule } from "@/features/systemUsers/components/PsychologistWorkSchedule";
  function Fixture({readOnly,assigned=true}) {
    const methods=useForm({defaultValues:{workSchedule:[{day:"TUESDAY",fromHour:"09",fromMinute:"30",toHour:"13",toMinute:"15",officeId:assigned?"office-1":""}]}});
    const {fields}=useFieldArray({control:methods.control,name:"workSchedule"});
    return <FormProvider {...methods}><UserWorkSchedule control={methods.control} register={methods.register} errors={{}} fields={fields}
      isViewMode={readOnly} selectedDays={["TUESDAY"]} handleSelectionChange={()=>{}}
      assignedOfficeOptions={assigned?[{value:"office-1",label:"Consultorio 101"}]:[]} /></FormProvider>;
  }
  export const render=(readOnly,assigned=true)=>renderToString(<Fixture readOnly={readOnly} assigned={assigned}/>);
`);

test("read-only user sheet displays saved office even when search has no results", () => {
  const html = ui.render(true);
  assert.match(html, /Consultorio 101/);
  assert.doesNotMatch(html, /No seleccionado|Sin consultorio asignado/);
  assert.match(ui.render(true, false), /Sin consultorio asignado/);
});

test("edit selector receives the saved office id and label without a catalog match", () => {
  assert.match(ui.render(false), /Consultorio 101/);
  assert.equal(globalThis.userEditSelectProps.value, "office-1");
  assert.deepEqual(globalThis.userEditSelectProps.options, [{ value: "office-1", label: "Consultorio 101" }]);
});

test("user page wires edit policy, nested office fallback and preserves stored minutes", async () => {
  const page = await readFile(new URL("../src/features/systemUsers/pages/SystemUserInformation.tsx", import.meta.url), "utf8");
  assert.match(page, /requireDocuments: requiresUserDocuments\(id\)/);
  assert.match(page, /officeId: resolveScheduleOfficeId\(schedule\)/);
  assert.match(page, /assignedOfficeOptions=\{getAssignedOfficeOptions/);
  assert.match(page, /startDate\.getUTCMinutes\(\)/);
  assert.match(page, /endDate\.getUTCMinutes\(\)/);
  assert.match(page, /processedDocuments\.length > 0 \? processedDocuments : undefined/);
});

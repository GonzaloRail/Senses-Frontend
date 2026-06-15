import { supabase } from "@/lib/supabaseClient";

export async function uploadFileToSupabase(
  file: File,
  pathPrefix = "uploads/"
) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${pathPrefix}${fileName}`;

  const { error } = await supabase.storage
    .from("data-senses")
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  const { data } = supabase.storage.from("data-senses").getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadPatientTestFileToSupabase(
  file: File,
  patientName: string,
  patientId: string,
  evaluationId: string,
  evaluationName: string,
  testId: string,
  testName: string,
  customFileName?: string
) {
  const patientSafeName = patientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-]/g, "-")
    .replace(/\-+/g, "-")
    .toLowerCase();
  const testSafeName = testName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-]/g, "-")
    .replace(/\-+/g, "-")
    .toLowerCase();
  const evaluationSafeName = evaluationName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-]/g, "-")
    .replace(/\-+/g, "-")
    .toLowerCase();
  const pathPrefix = `patient-tests/${patientSafeName}-${patientId}/${evaluationSafeName}-${evaluationId}/${testSafeName}-${testId}/`;
  const fileExt = file.name.split(".").pop();
  const fileName = customFileName ?? `prueba.${fileExt}`;
  const filePath = `${pathPrefix}${fileName}`;

  const { error } = await supabase.storage
    .from("data-senses")
    .upload(filePath, file, { upsert: true });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  const { data } = supabase.storage.from("data-senses").getPublicUrl(filePath);

  return data.publicUrl;
}

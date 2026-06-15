import api from "@/api/api";

interface GetUrlSignedResponse {
  uploadUrl: string;
  filePath: string;
}

export const uploadFileToCloudStorage = async (
  file: File,
  dni: string,
  docCustomName?: string
): Promise<string> => {
  const { data } = await api.post<GetUrlSignedResponse>(
    "/api/v1/files/upload-url",
    {
      fileName: docCustomName ? docCustomName : file.name,
      fileType: file.type,
      dni,
    }
  );
  const { uploadUrl, filePath } = data;

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return filePath;
};

import { FaFilePdf } from "react-icons/fa6";
import { FaFileAlt } from "react-icons/fa";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import type { DocumentLinkProps } from "../interfaces/ui/DocumentLinkProps";

export const DocumentLink = ({ name, url, type = "file", className }: DocumentLinkProps) => {
  return (
    <a href={url} target="_blank" className={`flex flex-row items-center gap-1 cursor-pointer ${className}`}>
      {type === "pdf" && <FaFilePdf className="min-w-5 text-red-500" />}
      {type === "file" && <FaFileAlt className="min-w-5 text-senses-primary" />}
      {type === "excel" && <PiMicrosoftExcelLogoFill className="min-w-5 text-green-500" />}
      <p className="hover:underline truncate">
        {name}
      </p>
    </a>
  )
}

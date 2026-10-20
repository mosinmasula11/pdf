import type {SignatureResult} from "./pdf-signature-check";

export function hasIntactOriginal(results?:readonly SignatureResult[]) {
  return !!results?.length && results.every(result=>result.integrity==="intact") && results.some(result=>result.coverage);
}

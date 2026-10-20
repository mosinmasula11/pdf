import {EsignVerifyTool} from "@/components/tools/EsignVerifyTool";
import {createToolMetadata} from "@/lib/seo";
export const metadata=createToolMetadata("esign-verify");
export default function Page(){
  return <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">E-sign Verify</h1>
    <p className="mt-2 mb-6 text-sm leading-6 text-slate-600">Check digital signature integrity in the original PDF. Password-protected files are opened locally before verification.</p>
    <EsignVerifyTool/>
  </div>;
}

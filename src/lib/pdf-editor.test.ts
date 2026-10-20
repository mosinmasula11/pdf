import {describe,expect,it} from "vitest";
import {PDFDocument,degrees} from "pdf-lib";
import {canvasPoint,annotationPlacement} from "./pdf-editor";
describe("PDF editor coordinates",()=>{
  it("maps both ends of a stroke consistently on desktop and mobile",()=>{
    const mobile={left:20,top:100,width:300,height:400};
    expect(canvasPoint(50,140,mobile,900,1200)).toEqual({x:90,y:120});
    expect(canvasPoint(170,300,mobile,900,1200)).toEqual({x:450,y:600});
    expect(canvasPoint(170,300,{left:20,top:100,width:600,height:800},900,1200)).toEqual({x:225,y:300});
  });
  it("handles zero-sized previews safely",()=>expect(canvasPoint(50,50,{left:0,top:0,width:0,height:0},100,100)).toEqual({x:0,y:0}));
  it.each([0,90,180,270])("preserves cropped page and rotation %i on export",async rotation=>{
    const doc=await PDFDocument.create(),page=doc.addPage([600,800]);
    page.setCropBox(20,30,500,700);page.setRotation(degrees(rotation));page.drawText("Original searchable content");
    const placement=annotationPlacement(page.getCropBox(),rotation);
    expect(placement.rotation).toBe(rotation);
    expect(placement.width).toBe(rotation%180?700:500);
    expect(placement.height).toBe(rotation%180?500:700);
    const saved=await PDFDocument.load(await doc.save());
    expect(saved.getPage(0).getRotation().angle).toBe(rotation);
    expect(saved.getPage(0).getCropBox()).toEqual({x:20,y:30,width:500,height:700});
  });
  it("maps overlay origins for rotated pages",()=>{
    const box={x:20,y:30,width:500,height:700};
    expect(annotationPlacement(box,90)).toMatchObject({x:520,y:30});
    expect(annotationPlacement(box,180)).toMatchObject({x:520,y:730});
    expect(annotationPlacement(box,-90)).toMatchObject({x:20,y:730,rotation:270});
  });
});

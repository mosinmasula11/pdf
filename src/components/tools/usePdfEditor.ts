"use client";

import {useState,useRef,useEffect,useCallback,type PointerEvent} from "react";
import {PDFDocument,degrees} from "pdf-lib";
import {getPdfJs} from "@/lib/pdfjs-helper";
import {canvasPoint,annotationPlacement} from "@/lib/pdf-editor";
export type ToolMode="draw"|"highlight"|"text";
type Point={x:number;y:number};
type Stroke={id:number;points:Point[];base:ImageData;color:string;width:number;highlight:boolean};
export function usePdfEditor(){
  const [file,setFile]=useState<File|null>(null);
  const [currentPage,setCurrentPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [toolMode,setToolMode]=useState<ToolMode>("draw");
  const [brushColor,setBrushColor]=useState("#2563eb");
  const [brushSize,setBrushSize]=useState(4);
  const [textInput,setTextInput]=useState("");
  const [processing,setProcessing]=useState(false);
  const [loading,setLoading]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [resultBlob,setResultBlob]=useState<Blob|null>(null);
  const [downloadName,setDownloadName]=useState("edited.pdf");
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const pdfCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const pageImages=useRef(new Map<number,string>());
  const readyPage=useRef(0);
  const previewVersion=useRef(0);
  const uploadVersion=useRef(0);
  const active=useRef<Stroke|null>(null);
  const history=useRef(new Map<number,string[]>());
  const [canUndo,setCanUndo]=useState(false);
  const invalidatePreview=useCallback(()=>{
    ++previewVersion.current;readyPage.current=0;active.current=null;
  },[]);
  const remember=()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const previous=history.current.get(currentPage)??[];
    previous.push(canvas.toDataURL("image/png"));
    history.current.set(currentPage,previous.slice(-15));
    setCanUndo(true);
  };
  const commit=()=>{
    const canvas=canvasRef.current;
    if(canvas&&readyPage.current===currentPage)pageImages.current.set(currentPage,canvas.toDataURL("image/png"));
  };
  const handleFile=async(incoming:FileList|null)=>{
    const selected=incoming?.[0];
    if(!selected)return;
    if(selected.type!=="application/pdf"&&!selected.name.toLowerCase().endsWith(".pdf")){setError("Please choose a valid PDF file.");return;}
    const version=++uploadVersion.current;
    ++previewVersion.current;
    readyPage.current=0;
    active.current=null;
    setUploading(true);setError(null);setResultBlob(null);
    let pdf:import("pdfjs-dist").PDFDocumentProxy|undefined;
    let task:import("pdfjs-dist").PDFDocumentLoadingTask|undefined;
    try{
      const bytes=await selected.arrayBuffer();
      await PDFDocument.load(bytes);
      const pdfjs=await getPdfJs();
      task=pdfjs.getDocument({data:bytes.slice(0)});
      pdf=await task.promise;
      if(version!==uploadVersion.current)return;
      pageImages.current.clear();history.current.clear();setCanUndo(false);
      setFile(selected);setTotalPages(pdf.numPages);setCurrentPage(1);
    }catch(err){
      if(version===uploadVersion.current){setFile(null);setError(err instanceof Error?err.message:"Could not open this PDF. Password-protected PDFs must be unlocked first.");}
    }finally{
      await task?.destroy();
      if(version===uploadVersion.current)setUploading(false);
      if(fileInputRef.current)fileInputRef.current.value="";
    }
  };
  const renderPagePreview=async(pdfFile:File,pageNum:number)=>{
    const version=++previewVersion.current;
    readyPage.current=0;active.current=null;setLoading(true);
    let pdf:import("pdfjs-dist").PDFDocumentProxy|undefined;
    let task:import("pdfjs-dist").PDFDocumentLoadingTask|undefined;
    try{
      const pdfjs=await getPdfJs();
      task=pdfjs.getDocument({data:await pdfFile.arrayBuffer()});
      pdf=await task.promise;
      if(version!==previewVersion.current)return;
      const page=await pdf.getPage(pageNum);
      const natural=page.getViewport({scale:1});
      const scale=Math.min(1.5,2400/Math.max(natural.width,natural.height));
      const viewport=page.getViewport({scale});
      const background=document.createElement("canvas");
      background.width=Math.ceil(viewport.width);background.height=Math.ceil(viewport.height);
      const ctx=background.getContext("2d");if(!ctx)throw new Error("Canvas is not available in this browser.");
      await page.render({canvas:background,canvasContext:ctx,viewport}).promise;
      const overlay=document.createElement("canvas");
      overlay.width=background.width;overlay.height=background.height;
      const saved=pageImages.current.get(pageNum);
      if(saved){
        const image=new Image();
        await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Could not restore annotations."));image.src=saved;});
        overlay.getContext("2d")?.drawImage(image,0,0,overlay.width,overlay.height);
      }
      if(version!==previewVersion.current||!canvasRef.current||!pdfCanvasRef.current)return;
      for(const [target,source] of [[pdfCanvasRef.current,background],[canvasRef.current,overlay]]){
        target.width=source.width;target.height=source.height;
        target.getContext("2d")?.drawImage(source,0,0);
      }
      readyPage.current=pageNum;setCanUndo(!!history.current.get(pageNum)?.length);
    }catch(err){if(version===previewVersion.current)setError(err instanceof Error?err.message:"Could not render PDF preview.");}
    finally{await task?.destroy();if(version===previewVersion.current)setLoading(false);}
  };
  useEffect(()=>{
    if(!file)return;
    const frame=requestAnimationFrame(()=>{void renderPagePreview(file,currentPage);});
    return()=>{cancelAnimationFrame(frame);invalidatePreview();};
  },[file,currentPage,invalidatePreview]);
  useEffect(()=>()=>{++uploadVersion.current;},[]);
  const point=(event:PointerEvent<HTMLCanvasElement>)=>{
    const canvas=event.currentTarget;
    return canvasPoint(event.clientX,event.clientY,canvas.getBoundingClientRect(),canvas.width,canvas.height);
  };
  const paint=()=>{
    const canvas=canvasRef.current,stroke=active.current;
    if(!canvas||!stroke)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    ctx.putImageData(stroke.base,0,0);
    ctx.save();ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;
    ctx.globalAlpha=stroke.highlight ? 0.35 : 1;ctx.lineWidth=stroke.width;ctx.lineCap="round";ctx.lineJoin="round";
    if(stroke.points.length===1){
      const start=stroke.points[0];ctx.beginPath();ctx.arc(start.x,start.y,stroke.width/2,0,Math.PI*2);ctx.fill();
    }else{
      ctx.beginPath();stroke.points.forEach((p,index)=>{if(index===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();
    }
    ctx.restore();
  };
  const handlePointerDown=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(!event.isPrimary||event.button!==0||processing||uploading||readyPage.current!==currentPage||active.current)return;
    event.preventDefault();
    const canvas=event.currentTarget,ctx=canvas.getContext("2d");if(!ctx)return;
    const p=point(event),scale=canvas.width/canvas.getBoundingClientRect().width;
    if(toolMode==="text"&&!textInput.trim())return;
    setResultBlob(null);remember();
    if(toolMode==="text"){
      ctx.save();ctx.font=`${16*scale}px sans-serif`;ctx.fillStyle=brushColor;
      textInput.split("\n").forEach((line,index)=>ctx.fillText(line,p.x,p.y+index*20*scale));
      ctx.restore();commit();return;
    }
    canvas.setPointerCapture(event.pointerId);
    active.current={id:event.pointerId,points:[p],base:ctx.getImageData(0,0,canvas.width,canvas.height),color:toolMode==="highlight"?"#facc15":brushColor,width:(toolMode==="highlight"?14:brushSize)*scale,highlight:toolMode==="highlight"};
    paint();
  };
  const handlePointerMove=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(active.current?.id!==event.pointerId)return;
    event.preventDefault();active.current.points.push(point(event));paint();
  };
  const handlePointerUp=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(active.current?.id!==event.pointerId)return;
    commit();active.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const changePage=(number:number)=>{
    if(loading||uploading||processing||number<1||number>totalPages)return;
    commit();active.current=null;readyPage.current=0;setResultBlob(null);setCurrentPage(number);
  };
  const resetAnnotations=()=>{
    if(!canvasRef.current||readyPage.current!==currentPage)return;
    remember();canvasRef.current.getContext("2d")?.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    pageImages.current.delete(currentPage);setResultBlob(null);
  };
  const undo=async()=>{
    const stack=history.current.get(currentPage),canvas=canvasRef.current;
    if(!stack?.length||!canvas||readyPage.current!==currentPage)return;
    const previous=stack.pop()!,version=previewVersion.current;
    readyPage.current=0;setLoading(true);
    const image=new Image();
    await new Promise<void>(resolve=>{image.onload=()=>resolve();image.onerror=()=>resolve();image.src=previous;});
    if(version!==previewVersion.current)return;
    readyPage.current=currentPage;setLoading(false);
    if(!image.naturalWidth){stack.push(previous);setError("Could not restore the previous annotation.");return;}
    const ctx=canvas.getContext("2d");ctx?.clearRect(0,0,canvas.width,canvas.height);ctx?.drawImage(image,0,0);
    commit();setResultBlob(null);setCanUndo(stack.length>0);
  };
  const saveEditedPdf=async()=>{
    if(!file||readyPage.current!==currentPage||active.current){setError("Wait for the preview and finish the current stroke before saving.");return;}
    setProcessing(true);setError(null);
    try{
      const pdf=await PDFDocument.load(await file.arrayBuffer());
      for(const [number,image] of pageImages.current){
        const embedded=await pdf.embedPng(image),page=pdf.getPage(number-1);
        const {rotation,...placement}=annotationPlacement(page.getCropBox(),page.getRotation().angle);
        page.drawImage(embedded,{...placement,rotate:degrees(rotation)});
      }
      const bytes=await pdf.save();
      setResultBlob(new Blob([new Uint8Array(bytes)],{type:"application/pdf"}));
      setDownloadName(`${file.name.replace(/\.pdf$/i,"")}-edited.pdf`);
    }catch(err){setError(err instanceof Error?err.message:"Failed to save edited PDF.");}
    finally{setProcessing(false);}
  };
  const clearFile=()=>{
    ++previewVersion.current;++uploadVersion.current;active.current=null;readyPage.current=0;
    pageImages.current.clear();history.current.clear();setFile(null);setResultBlob(null);setError(null);setLoading(false);setUploading(false);setCanUndo(false);
    if(fileInputRef.current)fileInputRef.current.value="";
  };
  return {file,currentPage,totalPages,toolMode,setToolMode,brushColor,setBrushColor,brushSize,setBrushSize,textInput,setTextInput,processing,loading,uploading,error,resultBlob,downloadName,canvasRef,pdfCanvasRef,fileInputRef,handleFile,handlePointerDown,handlePointerMove,handlePointerUp,changePage,resetAnnotations,undo,canUndo,saveEditedPdf,clearFile};
}

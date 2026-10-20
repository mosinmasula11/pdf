export function canvasPoint(clientX: number, clientY: number, rect: {left:number;top:number;width:number;height:number}, width:number, height:number) {
  if (rect.width <= 0 || rect.height <= 0) return {x:0,y:0};
  return {x:(clientX-rect.left)*width/rect.width,y:(clientY-rect.top)*height/rect.height};
}
export function annotationPlacement(box:{x:number;y:number;width:number;height:number}, angle:number) {
  const rotation=((angle%360)+360)%360;
  const {x,y,width,height}=box;
  if(rotation===90)return {x:x+width,y,width:height,height:width,rotation};
  if(rotation===180)return {x:x+width,y:y+height,width,height,rotation};
  if(rotation===270)return {x,y:y+height,width:height,height:width,rotation};
  return {x,y,width,height,rotation:0};
}

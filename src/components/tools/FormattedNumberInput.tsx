"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ChangeEvent } from "react";
import { groupNumber } from "@/lib/number-format";
import { useCurrencyFormat } from "./CurrencyFormat";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value"> & {value?: string | number};
export function FormattedNumberInput({value="",onChange,onKeyDown,type,...props}: Props) {
  const {currency}=useCurrencyFormat();
  const [draft,setDraft]=useState(String(value));
  const [emitted,setEmitted]=useState(String(value));
  const input=useRef<HTMLInputElement>(null);
  const caret=useRef<number|null>(null);
  const normalized=String(value).replace(/,/g,"");
  const raw=normalized===emitted || (normalized==="" && emitted==="0")?draft:normalized;
  const display=groupNumber(raw,currency);
  useLayoutEffect(()=>{
    if(caret.current!==null) input.current?.setSelectionRange(caret.current,caret.current);
    caret.current=null;
  });
  return <input {...props} ref={input} type={type==="number"?"text":type??"text"} inputMode="decimal" value={display}
    onKeyDown={event=>{
      onKeyDown?.(event);
      const field=event.currentTarget,start=field.selectionStart??0;
      if(start!==field.selectionEnd)return;
      if(event.key==="Backspace"&&display[start-1]===",")field.setSelectionRange(Math.max(0,start-2),start);
      if(event.key==="Delete"&&display[start]===",")field.setSelectionRange(start,start+2);
    }}
    onChange={event=>{
      const next=event.target.value.replace(/,/g,"");
      if(!/^-?\d{0,15}(\.\d{0,8})?$/.test(next))return;
      const count=event.target.value.slice(0,event.target.selectionStart??0).replace(/,/g,"").length;
      const formatted=groupNumber(next,currency);
      let position=0,seen=0;
      while(position<formatted.length&&seen<count){if(formatted[position]!==",")seen++;position++;}
      caret.current=position;
      const numeric=next===""?"":next==="-"?NaN:Number(next);
      setEmitted(String(numeric));
      setDraft(next);
      onChange?.({...event,target:{...event.target,value:next},currentTarget:{...event.currentTarget,value:next}} as ChangeEvent<HTMLInputElement>);
    }}/>;
}

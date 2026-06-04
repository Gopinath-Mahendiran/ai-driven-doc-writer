function SymbolItem({ symbol, indexPath, expandedIndexes, setExpandedIndexes, HandleCallBack }) {
  const isExpanded = expandedIndexes[indexPath] || false;

  const toggleExpand = () => {
    setExpandedIndexes(prev => ({
      ...prev,
      [indexPath]: !prev[indexPath]
    }));
  };

  return (  
    <div className="text-sm py-1 rounded-lg ">
      {symbol.type === 'function' ? (
        <div className="flex items-start flex-col">
          <div className="flex items-center ">
            <button className="w-[20px]  h-[28px] border-color-gray-600 rounded hover:bg-gray-700" onClick={toggleExpand}>
              {symbol.children && symbol.children.length > 0 && (isExpanded ? <MdKeyboardArrowDown  /> : <MdKeyboardArrowRight  />)}
            </button>
            <Func symbol={symbol} HandleCallBack={HandleCallBack} />
          </div>
          {isExpanded && symbol.children && symbol.children.length > 0 && (
            <div className="pl-5 mt-2 w-full space-y-1 border-l-2 border-gray-600 ml-2">
              {symbol.children.map((child, i) => (
                <SymbolItem
                  key={i}
                  symbol={child}
                  indexPath={`${indexPath}-${i}`}
                  expandedIndexes={expandedIndexes}
                  setExpandedIndexes={setExpandedIndexes}
                  HandleCallBack={HandleCallBack}
                />
              ))}
            </div>
          )}
        </div>
      ) : symbol.type === 'class' ? (
        <div className="flex items-start flex-col">
          <div className="flex items-center">
            <button className=" w-[20px]  h-[28px] border-color-gray-600 rounded hover:bg-gray-700" onClick={toggleExpand}>
              {symbol.children && symbol.children.length > 0 && (isExpanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />)}
            </button>
            <ClassDef symbol={symbol} HandleCallBack={HandleCallBack} />
          </div>
          {isExpanded && symbol.children && symbol.children.length > 0 && (
            <div className="pl-5 mt-2 w-full space-y-1 border-l-2 border-gray-600 ml-2">
              {symbol.children.map((child, i) => (
                <SymbolItem
                  key={i}
                  symbol={child}
                  indexPath={`${indexPath}-${i}`}
                  expandedIndexes={expandedIndexes}
                  setExpandedIndexes={setExpandedIndexes}
                  HandleCallBack={HandleCallBack}
                />
              ))}
            </div>
          )}
        </div>
      ) : symbol.type === 'constant' ? (
        <ConstDef symbol={symbol} HandleCallBack={HandleCallBack} />
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { MdKeyboardArrowRight,MdKeyboardArrowDown } from "react-icons/md";

function Func({ symbol ,HandleCallBack}) {
  return (
    <div className="flex items-center">
      <button className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 w-full" onClick={()=>{
        HandleCallBack(symbol);
        // console.log("Function clicked:", symbol.name, "at line:", symbol.line);
      }}>
        <div className={"text-xs text-bold bg-blue-800/30 text-blue-500  rounded-lg border-gray-700 px-2 py-1 w-fit"}>Func</div>
        <div className=" text-bold px-2 text-sm text-white-500 mt-0.5">{symbol.name}</div>
      </button>
    </div>
  );
}

function ClassDef({ symbol ,HandleCallBack }) {
  return (
    <div className="flex">
      <button className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 w-full" onClick={() => HandleCallBack(symbol)}>
        <div className={"text-xs text-bold bg-violet-800/30 text-violet-500 rounded-lg border-gray-700 px-2 py-1 w-fit"}>Class</div>
        <div className="text-bold px-2 text-sm text-white-500 mt-0.5">{symbol.name}</div>
      </button>
    </div>
  );
}

function ConstDef({ symbol, HandleCallBack }) {
  return (
    <div className="flex">
      <button className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 w-full" onClick={() => HandleCallBack(symbol)}>
        <div className={"text-xs text-bold bg-amber-800/30 text-amber-500 rounded-lg border-gray-700 px-2 py-1 w-fit"}>Const</div>
        <div className="text-bold px-2 text-sm text-white-500 mt-0.5">{symbol.name} = {JSON.stringify(symbol.value)}</div>
      </button>
    </div>
  );
}


function SymbolSheet({ symbols,callback }) {
  
  const [expandedIndexes, setExpandedIndexes] = useState({});

  function HandleCallBack(symbol){
    console.log("Symbol clicked:", symbol);
    callback(symbol);
  }

  return (
    <div className="symbol-sheet">
      <h2 className="text-lg font-bold mb-2">Symbol Sheet</h2>
      <div className="list-disc pl-5">
        {symbols.map((symbol, index) => (
          <SymbolItem
            key={index}
            symbol={symbol}
            indexPath={`${index}`}
            expandedIndexes={expandedIndexes}
            setExpandedIndexes={setExpandedIndexes}
            HandleCallBack={HandleCallBack}
          />
        ))}
      </div>
    </div>
      );
}

export default SymbolSheet;

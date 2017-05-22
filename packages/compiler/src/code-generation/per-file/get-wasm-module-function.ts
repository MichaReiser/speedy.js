/**
 * This file includes a single statement, the function declaration of the getWasmModuleFactory. This function is used in the
 * speedyjs-transformer to generate the code to load the wasm module.
 * Part of this source code has been taken from https://github.com/kripken/emscripten/blob/incoming/src/runtime.js
 */

declare function fetch(url: string): Promise<any>;
declare var window: any;

interface Type {
    primitive: boolean,
    fields: { name: string, type: string }[],
    constructor?: Function;
    typeArguments: string[];
}


interface Types {
    [name: string]: Type
}

interface ModuleLoader {
    (): Promise<WebAssemblyInstance>;
    gc(): void;
    /**
     * Converts the given value to the JS equivalent
     * @param ptr the ptr of the WASM object in the heap
     * @param type the type of the object
     */
    toJSObject(ptr: int, type: string): any;

    /**
     * Converts the js object (array or object) to a WASM pointer
     * @param jsObject the js object
     * @param type the type of the object
     * @param objectReferences Map from the JS object to the WASM pointer for this object. Used to ensure reference equality across the
     * boundary
     */
    toWASM(jsObject: Object, type: string, objectReferences: Map<object, int>): int | undefined;
}

function __moduleLoader(this: any, wasmUri: string, types: Types, options: { totalStack: int, initialMemory: int, globalBase: int, staticBump: int }): ModuleLoader {
    const PTR_SIZE = 4;
    const PTR_SHIFT = Math.log2(PTR_SIZE);

    function sizeOf(type: string): int {
        switch (type) {
            case "i1":
            case "i8":
                return 1;
            case "i32":
                return 4;
            case "double":
                return 8;
            default: // all objects are pointers
                return PTR_SIZE;
        }
    }

    function getHeapValue(ptr: int, type: string) {
        switch (type) {
            case "i1":
            case "i8":
                return heap8[ptr];
            case "i32":
                return heap32[ptr >> 2] | 0;
            case "double":
                return heap64[ptr >> 3];
            default: // all objects are pointers
                return heapPtr[ptr >> PTR_SHIFT] | 0;
        }
    }

    function setHeapValue(ptr: int, value: any, type: string) {
        switch (type) {
            case "i1":
            case "i8":
                heap8[ptr] = value;
                break;
            case "i32":
                heap32[ptr >> 2] = value;
                break;
            case "double":
                heap64[ptr >> 3] = value;
                break;
            default: // all objects are pointers
                heapPtr[ptr >> PTR_SHIFT] = value;
        }
    }

    let heap8: Int8Array;
    let heap32: Int32Array;
    let heapPtr: Int32Array;
    let heap64: Float64Array;

    let malloc: (size: int) => int = () => { throw new Error("malloc not defined"); };
    let free: (ptr: int) => void = () => void 0;

    function updateHeap(buffer: ArrayBuffer) {
        heap8 = new Int8Array(buffer);
        heap32 = heapPtr = new Int32Array(buffer);
        heap64 = new Float64Array(buffer);
    }

    /**
     * Computes the size of a not packed object
     */
    function computeObjectSize(type: Type) {
        return type.fields.reduce((memo, field) => {
            const fieldSize = sizeOf(field.type);
            return alignMemory(memo + fieldSize, fieldSize);
        }, 0);
    }

    function jsToWasm(jsValue: any, typeName: string, objectReferences: Map<object, int>): any {
        const type = types[typeName];

        if (!type) { throw new Error("Unknown type " + typeName) }

        if (type.primitive) {
            return jsValue;
        }

        if (typeof(jsValue) === "undefined" || jsValue === null) {
            throw new Error("Undefined and null values are not supported");
        }

        let ptr = objectReferences.get(jsValue);
        if (typeof(ptr) !== "undefined") {
            return ptr;
        }

        if (type.constructor === Array) {
            if (!Array.isArray(jsValue)) {
                throw new Error("Expected argument of type Array");
            }

            ptr = RuntimeArray.from(jsValue as any[], type.typeArguments[0], objectReferences).ptr;
        } else {
            // Object
            if (typeof(jsValue) !== "object") {
                throw new Error(`Expected argument of type object but was typeof ${typeof(jsValue)}.`);
            }

            if (jsValue.constructor !== type.constructor) {
                throw new Error(`Expected object of type ${type.constructor} but was ${jsValue.constructor} (inheritance is not supported).`);
            }

            const size = computeObjectSize(type);
            const objPtr = malloc(size);
            if (objPtr === 0) {
                throw new Error("Failed to allocate object");
            }

            let offset = 0;
            for (const field of type.fields) {
                const fieldSize = sizeOf(field.type);
                offset = alignMemory(offset, fieldSize);

                setHeapValue(objPtr + offset, jsToWasm(jsValue[field.name], field.type, objectReferences), field.type);

                offset += fieldSize;
            }

            ptr = objPtr;
        }

        objectReferences.set(jsValue, ptr);

        return ptr;
    }

    function wasmToJs(wasmValue: any, typeName: string, returnedObjects: Map<int, object>) {
        const type = types[typeName];
        if (!type) { throw new Error("Unknown type " + typeName) }

        if (type.primitive) {
            if (typeName === "i1") {
                return wasmValue !== 0;
            }

            return wasmValue;
        }

        const ptr = wasmValue as int;
        let objectReference = returnedObjects.get(ptr);

        if (typeof objectReference !== "undefined") {
            return objectReference;
        }

        if (ptr === 0) {
            return undefined;
        } else if (type.constructor === Array) {
            objectReference = new RuntimeArray(ptr, type.typeArguments[0]).toArray(returnedObjects);
        } else {
            // Object
            const obj: { [name: string]: any } = Object.create(type.constructor!.prototype); // ensure it is an instance of the class
            let memoryOffset = wasmValue as int;

            for (const field of type.fields) {
                const fieldSize = sizeOf(field.type);
                memoryOffset = alignMemory(memoryOffset, fieldSize);
                obj[field.name] = wasmToJs(getHeapValue(memoryOffset, field.type), field.type, returnedObjects);
                memoryOffset += fieldSize;
            }

            objectReference = obj;
        }

        returnedObjects.set(ptr, objectReference);

        return objectReference;
    }

    class RuntimeArray {
        /**
         * Allocates a Speedy.js array for the given JS array
         * @param native the js array
         * @param elementType the element type
         * @return {RuntimeArray} the Speedy.js Array
         */
        static from(native: any[], elementType: string, objectReferences: Map<object, int>): RuntimeArray {
            // begin, back, capacity
            const size = PTR_SIZE * 2 + sizeOf("i32");
            const arrayPtr = malloc(size);
            const elementSize = sizeOf(elementType);
            const elementsPtr = malloc(elementSize * native.length);

            if (arrayPtr === 0 || elementsPtr === 0) {
                throw new Error("Failed to allocate array");
            }

            const begin = elementsPtr;
            const back = elementsPtr + (elementSize * native.length);

            heapPtr[arrayPtr >> PTR_SHIFT] = begin;
            heapPtr[(arrayPtr + PTR_SIZE) >> PTR_SHIFT] = back;
            heap32[(arrayPtr + 2 * PTR_SIZE) >> 2] = native.length | 0;

            switch (elementType) {
                case "i1":
                case "i8":
                    heap8.set(native, begin);
                    break;
                case "i32":
                    heap32.set(native, begin >> 2);
                    break;
                case "double":
                    heap64.set(native, begin >> 3);
                    break;
                default:
                    heapPtr.set(Int32Array.from(native, object => jsToWasm(object, elementType, objectReferences)), begin >> PTR_SHIFT);
            }

            return new RuntimeArray(arrayPtr, elementType);
        }

        constructor(public ptr: int, private elementType: string) {
        }

        get begin(): int {
            return heapPtr[this.ptr >> PTR_SHIFT] | 0;
        }

        get back(): int {
            return heapPtr[(this.ptr + PTR_SIZE) >> PTR_SHIFT] | 0;
        }

        /**
         * Converts a Speedy.js array to a native JS array
         * @param objectReferences map from WASM pointers to the deserialized JS objects
         * @return {Array} the native JS Array
         */
        toArray(objectReferences: Map<int, object>): any[] {
            switch (this.elementType) {
                case "i1":
                    return Array.from(heap8.subarray(this.begin, this.back), value => value !== 0); // Elements need to be converted to bool
                case "i8":
                    return Array.from(heap8.subarray(this.begin, this.back));
                case "i32":
                    return Array.from(heap32.subarray(this.begin >> 2, this.back >> 2));
                case "double":
                    return Array.from(heap64.subarray(this.begin >> 3, this.back >> 3));
                default:
                    return Array.from(heapPtr.subarray(this.begin >> PTR_SHIFT, this.back >> PTR_SHIFT), objectPtr => wasmToJs(objectPtr, this.elementType, objectReferences));
            }
        }
    }

    const TOTAL_STACK = options.totalStack;
    const INITIAL_MEMORY = options.initialMemory;
    let totalMemory = INITIAL_MEMORY;
    const GLOBAL_BASE = options.globalBase;
    const STATIC_BUMP = options.staticBump;

    const WASM_PAGE_SIZE = 64 * 1024;
    const memory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / WASM_PAGE_SIZE });

    heap8 = new Int8Array(memory.buffer);
    heap32 = heapPtr = new Int32Array(memory.buffer);
    heap64 = new Float64Array(memory.buffer);

    const STATIC_TOP = GLOBAL_BASE + STATIC_BUMP;
    const STACK_BASE = alignMemory(STATIC_TOP);
    const STACK_TOP = STACK_BASE + TOTAL_STACK;
    const STACK_MAX = STACK_BASE + TOTAL_STACK;

    const DYNAMIC_BASE = alignMemory(STACK_MAX);
    // the top of the heap
    const DYNAMIC_TOP_PTR = STATIC_TOP;

    heap32[GLOBAL_BASE >> 2] = STACK_TOP;
    heap32[DYNAMIC_TOP_PTR >> 2] = DYNAMIC_BASE;

    function sbrk(increment: number) {
        increment = increment|0;
        let oldDynamicTop = 0;
        let newDynamicTop = 0;
        increment = ((increment + 15) & -16)|0;
        oldDynamicTop = heap32[DYNAMIC_TOP_PTR >> 2] | 0;
        newDynamicTop = oldDynamicTop + increment | 0;

        if (((increment|0) > 0 && (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
            || (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
            console.error("Signed 32 wrap around detected");
            return -1;
        }

        heap32[DYNAMIC_TOP_PTR >> 2] = newDynamicTop;
        if ((newDynamicTop|0) > (totalMemory|0)) {
            let pagesToAdd = 0;

            while ((newDynamicTop|0) > (totalMemory|0)) {
                pagesToAdd = (totalMemory / WASM_PAGE_SIZE * 0.5) | 0;
                totalMemory += pagesToAdd * WASM_PAGE_SIZE;
            }

            memory.grow(pagesToAdd);

            updateHeap(memory.buffer);
        }
        return oldDynamicTop|0;
    }

    function alignMemory(size: int, quantum?: int): int {
        return Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16);
    }

    function loadInstance(): Promise<WebAssemblyInstance> {
        let instance: WebAssemblyInstance;

        let wasmLoaded: Promise<ArrayBuffer>;
        // browser
        if (typeof window !== "undefined") {
            if (typeof fetch !=="function") {
                throw new Error("Your browser does not support the fetch API. Include a fetch polyfill to load the WASM module");
            }

            wasmLoaded = fetch(wasmUri).then(function (response: any) {
                if (response.ok) {
                    return response.arrayBuffer();
                }

                throw new Error("Failed to load WASM module from " + wasmUri + " (" + response.statusText + ").");
            });
        } else if (typeof module !== 'undefined' && module.exports) { // Node.js
            wasmLoaded = new Promise(function (resolve, reject) {
                // trick webpack to not detect the require call. Webpack should not include the required files as we only
                // want to execute this code if we are in node and use the fetch api in the browser.
                const req = (module as any)["require"] as NodeRequire;
                const fs = req("fs");
                const path = req("path");
                fs.readFile(path.join(__dirname, wasmUri), function (error: any, data: Buffer) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data.buffer);
                    }
                });
            });
        } else {
            throw new Error("Unknown environment, can not load WASM module");
        }

        return wasmLoaded.then(function (buffer) {
            return WebAssembly.instantiate(buffer, {
                env: {
                    memory: memory,
                    STACKTOP: STACK_TOP,
                    __dso_handle: 0,
                    "__cxa_allocate_exception": function (size: int) {
                        return malloc(size);
                    },
                    "__cxa_throw": function () {
                        throw new Error("Exceptions not yet supported");
                    },
                    "__cxa_find_matching_catch_2": function () {
                        throw new Error("Exceptions not yet supported");
                    },
                    "__cxa_free_exception": function (ptr: int) {
                        try {
                            return free(ptr);
                        } catch(e) {
                            console.error('exception during cxa_free_exception: ' + e);
                        }
                    },
                    "__resumeException": function () {
                        throw new Error("Exceptions not yet supported");
                    },
                    "__cxa_atexit": function () {
                        throw new Error("Exceptions not yet supported");
                    },
                    "pow": Math.pow,
                    "fmod": function frem(x: number, y: number) {
                        return x % y;
                    },
                    "abort": function (what: any) {
                        console.error("Abort WASM for reason: " + what);
                    },
                    "invoke_ii": function (index: number, a1: number) {
                        return instance.exports.dynCall_ii(index, a1);
                    },
                    "invoke_iii": function (index: number, a1: number, a2: number) {
                        return instance.exports.dynCall_iii(index, a1, a2);
                    },
                    "invoke_iiii": function (index: number, a1: number, a2: number, a3: number) {
                        return instance.exports.dynCall_iiii(index, a1, a2, a3);
                    },
                    "invoke_iiiii": function (index: number, a1: number, a2: number, a3: number, a4: number) {
                        return instance.exports.dynCall_iiiii(index, a1, a2, a3, a4);
                    },
                    "invoke_viii": function (index: void, a1: number, a2: number, a3: number) {
                        return instance.exports.dynCall_viii(index, a1, a2, a3);
                    },
                    "sbrk": sbrk
                }
            });
        }).then(result => {
            instance = result.instance;
            free = instance.exports.free || free;
            malloc = instance.exports.malloc || malloc;
            return instance;
        });
    }

    let speedyJsGc: () => void | undefined;
    function gc() {
        if (speedyJsGc) {
            speedyJsGc();
        }
    }

    let loaded: Promise<WebAssemblyInstance> | undefined = undefined;
    const loader = function loader () {
        if (loaded) {
            return loaded;
        }

        loaded = loadInstance().then(instance => {
            speedyJsGc = instance.exports.speedyJsGc;
            return instance;
        });
        return loaded;
    } as ModuleLoader;

    loader.gc = gc;
    loader.toWASM = function (jsObject: Object, objectTypeName: string, objectReferences: Map<object, int>) {
        return jsToWasm(jsObject, objectTypeName, objectReferences) as int;
    };

    loader.toJSObject = function(objectPointer: int, objectTypeName: string) {
        return wasmToJs(objectPointer, objectTypeName, new Map<int, object>());
    };

    return loader;
}

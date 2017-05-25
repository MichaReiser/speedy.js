declare interface EnvType {
    [name: string]: any;
    imports?: { [name: string]: any };
    memory: WebAssemblyMemory;
}

declare interface ImportObject {
    imports?: { [name: string]: any };
    env?: EnvType;
}

declare interface WebAssemblyMemory {
    buffer: ArrayBuffer;
    grow(size: number): number;
}

declare interface WebAssemblyMemoryConstructor {
    new (memoryDescriptor: { initial: number, maximum?: number }): WebAssemblyMemory;
}

declare interface WebAssemblyConstructor {
    Memory: WebAssemblyMemoryConstructor;
    instantiate(buffer: ArrayBuffer, imports?: ImportObject): Promise<{ instance: WebAssemblyInstance, module: WebAssemblyModule}>;
    instantiate(module: WebAssemblyModule, imports?: ImportObject): Promise<WebAssemblyInstance>;
}

declare const WebAssembly: WebAssemblyConstructor;

declare interface WebAssemblyInstance {
    exports: { [name: string]: any };
}

// tslint:disable-next-line
declare interface WebAssemblyModule {

}

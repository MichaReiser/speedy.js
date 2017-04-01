/**
 * Meta data stored in the bottom of the WAST File
 *
 * @code
 * (module
 * (import "env" "memory" (memory $0 256))
 * (table 0 anyfunc)
 * (export "fib" (func $fib))
 * (func $fib (param $0 i32) (result i32)
 * ....
 * )
 * )
 * ;; METADATA: { "asmConsts": {},"staticBump": 8, "initializers": [] }
 *
 * The last line is the meta data that we are interested in/
 */
export interface WastMetaData {

    /**
     * The static bump (static data stored in module
     */
    staticBump: number;

    /**
     * is string correct?
     */
    asmConsts: string[];


    /**
     * Is string correct?
     */
    initializers: string[];
}

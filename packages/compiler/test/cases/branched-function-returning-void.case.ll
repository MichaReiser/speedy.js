; ModuleID = 'test/cases/branched-function-returning-void.case.ts'
source_filename = "test/cases/branched-function-returning-void.case.ts"
target datalayout = "e-m:e-p:32:32-i64:64-n32:64-S128"
target triple = "wasm32-unknown-unknown"

define void @branchedFunctionReturningVoid(i32 %arg1) {
entry:
  %count = alloca i32
  %arg = alloca i32
  store i32 %arg1, i32* %arg
  store i32 0, i32* %count, align 4
  %arg2 = load i32, i32* %arg, align 4
  %0 = icmp sgt i32 %arg2, 10
  br i1 %0, label %then, label %else

then:                                             ; preds = %entry
  %count3 = load i32, i32* %count, align 4
  store i32 0, i32* %count
  br label %if-successor

else:                                             ; preds = %entry
  %count4 = load i32, i32* %count, align 4
  %arg5 = load i32, i32* %arg, align 4
  store i32 %arg5, i32* %count
  br label %if-successor

if-successor:                                     ; preds = %else, %then
  %count6 = load i32, i32* %count, align 4
  %1 = add i32 %count6, 1
  store i32 %1, i32* %count
  ret void
}

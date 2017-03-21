//
// Created by Micha Reiser on 14.03.17.
//

#ifndef SPEEDYJS_RUNTIME_MACROS_H
#define SPEEDYJS_RUNTIME_MACROS_H

/**
 * Defines if the runtime should be memory safe or not. If defined, runtime is memory safe, otherwise the runtime
 * might emit checks needed to guarantee memory safety to increase performance.
 */
#ifndef SAFE
    #ifndef UNSAFE
        #define SAFE
    #endif
#endif

#if defined _WIN32 || defined __CYGWIN__
#ifdef BUILDING_DLL
    #ifdef __GNUC__
      #define DLL_PUBLIC __attribute__ ((dllexport))
    #else
      #define DLL_PUBLIC __declspec(dllexport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #else
    #ifdef __GNUC__
      #define DLL_PUBLIC __attribute__ ((dllimport))
    #else
      #define DLL_PUBLIC __declspec(dllimport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #endif
  #define DLL_LOCAL
#else
#if __GNUC__ >= 4
#define DLL_PUBLIC __attribute__ ((visibility ("default")))
#define DLL_LOCAL  __attribute__ ((visibility ("hidden")))
#else
#define DLL_PUBLIC
    #define DLL_LOCAL
#endif
#endif

#ifndef ALWAYS_INLINE
#define ALWAYS_INLINE __attribute__((always_inline))
#endif

#endif //SPEEDYJS_RUNTIME_MACROS_H

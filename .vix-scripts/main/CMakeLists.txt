cmake_minimum_required(VERSION 3.20)
project(main LANGUAGES CXX)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_RULE_MESSAGES OFF)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if (NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug CACHE STRING "Build type" FORCE)
endif()

option(VIX_ENABLE_SANITIZERS "Enable sanitizers (dev only)" OFF)
set(VIX_SANITIZER_MODE "asan_ubsan" CACHE STRING "Sanitizer mode: asan_ubsan or ubsan")
set_property(CACHE VIX_SANITIZER_MODE PROPERTY STRINGS asan_ubsan ubsan)
option(VIX_ENABLE_LIBCXX_ASSERTS "Enable libstdc++ debug mode (_GLIBCXX_ASSERTIONS/_GLIBCXX_DEBUG)" OFF)
option(VIX_ENABLE_HARDENING "Enable extra hardening flags (non-MSVC)" OFF)
option(VIX_USE_ORM "Enable Vix ORM (requires vix::orm)" OFF)
add_executable(main "/home/softadastra/vixcpp/vixcpp.github.io/main.cpp")

if (MSVC)
  target_compile_options(main PRIVATE /W4 /permissive- /EHsc)
  target_compile_definitions(main PRIVATE _CRT_SECURE_NO_WARNINGS)
else()
  target_compile_options(main PRIVATE
    -Wall -Wextra -Wpedantic
    -Wshadow -Wconversion -Wsign-conversion
    -Wformat=2 -Wnull-dereference
  )
endif()

if (NOT MSVC)
  target_compile_options(main PRIVATE -fno-omit-frame-pointer)
  if (UNIX AND NOT APPLE)
    target_link_options(main PRIVATE -rdynamic)
  endif()
endif()

if (VIX_ENABLE_LIBCXX_ASSERTS AND NOT MSVC)
  target_compile_definitions(main PRIVATE _GLIBCXX_ASSERTIONS)
endif()

if (VIX_ENABLE_HARDENING AND NOT MSVC)
  target_compile_options(main PRIVATE -D_FORTIFY_SOURCE=2)
  target_link_options(main PRIVATE -Wl,-z,relro -Wl,-z,now)
endif()

if (UNIX AND NOT APPLE)
  target_link_libraries(main PRIVATE pthread dl)
endif()

if (VIX_ENABLE_SANITIZERS AND NOT MSVC)
  if (VIX_SANITIZER_MODE STREQUAL "ubsan")
    message(STATUS "Sanitizers: UBSan enabled")
    target_compile_options(main PRIVATE
      -O0 -g3
      -fno-omit-frame-pointer
      -fsanitize=undefined
      -fno-sanitize-recover=all
    )
    target_link_options(main PRIVATE -fsanitize=undefined)
  else()
    message(STATUS "Sanitizers: ASan+UBSan enabled")
    target_compile_options(main PRIVATE
      -O1 -g3
      -fno-omit-frame-pointer
      -fsanitize=address,undefined
      -fno-sanitize-recover=all
    )
    target_link_options(main PRIVATE -fsanitize=address,undefined)
    target_compile_definitions(main PRIVATE VIX_ASAN_QUIET=1)
  endif()
endif()

if (UNIX AND NOT APPLE)
  target_compile_options(main PRIVATE -g)
endif()

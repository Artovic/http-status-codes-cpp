cmake_minimum_required(VERSION 3.0)

# Package Management using Hunter
include("cmake/HunterGate.cmake")

HunterGate(
	URL "https://github.com/ruslo/hunter/archive/v0.19.119.tar.gz"
	SHA1 "ad19af382dfc285a255b91c713b651216e6feff2"
)

project(HttpStatusCodes)

set (CMAKE_CXX_STANDARD 11)

hunter_add_package(GTest)
find_package(GTest CONFIG REQUIRED)

enable_testing()

include_directories(${PROJECT_SOURCE_DIR}/..)

add_executable(CVariantTest CVariantTest.cpp)
target_link_libraries(CVariantTest GTest::main)
add_test(NAME CVariantTest COMMAND CVariantTest)

add_executable(CVariantCompileTest CVariantCompileTest.c)
add_test(NAME CVariantCompileTest COMMAND CVariantCompileTest)
set_target_properties(CVariantCompileTest PROPERTIES
	LINKER_LANGUAGE "C"
	C_STANDARD 90
	C_STANDARD_REQUIRED ON
)

add_executable(C++VariantTest C++VariantTest.cpp)
target_link_libraries(C++VariantTest GTest::main)
add_test(NAME C++VariantTest COMMAND C++VariantTest)
set_target_properties(C++VariantTest PROPERTIES
	CXX_STANDARD 98
	CXX_STANDARD_REQUIRED ON
)

add_executable(C++11VariantTest C++11VariantTest.cpp)
target_link_libraries(C++11VariantTest GTest::main)
add_test(NAME C++11VariantTest COMMAND C++11VariantTest)
set_target_properties(C++11VariantTest PROPERTIES
	CXX_STANDARD 11
	CXX_STANDARD_REQUIRED ON
)

set(CMAKE_AUTOMOC ON)
find_package(Qt5 COMPONENTS Core OPTIONAL_COMPONENTS Network)
if (Qt5_FOUND)
	set(QTCORE_LIB "Qt5::Core")
endif()
if (NOT Qt5_FOUND)
	find_package(Qt4 COMPONENTS QtCore OPTIONAL_COMPONENTS QtNetwork)
	if (Qt4_FOUND)
		set(QTCORE_LIB "Qt4::QtCore")
	endif()
endif()


if (QTCORE_LIB)
	add_executable(QtVariantTest QtVariantTest.cpp)
	target_link_libraries(QtVariantTest GTest::main ${QTCORE_LIB})
	add_test(NAME QtVariantTest COMMAND QtVariantTest)
endif()

if (Qt5_VERSION_MINOR GREATER_EQUAL "8")
	add_executable(Qt5.8VariantTest Qt5.8VariantTest.cpp "${PROJECT_SOURCE_DIR}/../HttpStatusCodes_Qt5.8.h")
	target_link_libraries(Qt5.8VariantTest GTest::main ${QTCORE_LIB})
	add_test(NAME Qt5.8VariantTest COMMAND Qt5.8VariantTest)
endif()
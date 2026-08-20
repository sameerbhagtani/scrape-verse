export default {
    testEnvironment: "node",
    preset: "ts-jest/presets/default-esm",
    testMatch: ["**/__tests__/**/*.test.ts"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                isolatedModules: true,
            },
        ],
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};

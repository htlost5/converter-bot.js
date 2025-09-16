import js from '@eslint/js';
import * as pluginImportx from 'eslint-plugin-import-x';
import globals from 'globals';

export default [
    js.configs.recommended,
    pluginImportx.flatConfigs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: latest,
            sourceType: 'module',
        },
        rules: {
            
        }
    }
]
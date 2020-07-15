# Pyformat

Providing code formatting and import sorting for python codes using `autopep8`, `black` and `isort`.

Pyformat will read your "python.pythonPath" configuration to choose correct python environment.

Note: format provider (`autopep8` or `black`) and `isort` must be manually installed in your selected python environment.

## Why
There's some reason that I can't use the official [vscode-python](https://marketplace.visualstudio.com/items?itemName=ms-python.python), so I created this extension for myself.

If `vscode-python` suits you just fine, you may not need PyFormat.

## Configuration
```typescript
{
  /**
   * Which format provider should PyFormat use when formatting codes.
   * autopep8 and black are supported, defaults to autopep8
   */
  pyformat.formatProvider: 'autopep8' | 'black'

  /**
   * Arguments passed to autopep8, defaults to ["--max-line-length 120"].
   * See https://github.com/hhatto/autopep8#configuration for more info.
   */
  pyformat.autopep8Args: string[]

  /**
   * Arguments passed to black, defaults to ["--line-length 120"].
   * See https://github.com/psf/black#command-line-options for more info.
   */
  pyformat.blackArgs: string[]

  /**
   * Arguments passed to isort, defaults to [ "-w 120", "-m 2" ].
   * See https://github.com/timothycrosley/isort#configuring-isort for more info.
   */
  pyformat.isortArgs: string[]

  /**
   * Enable import organization functionality. defaults to true.
   * You can turn this off if you already have other extensions deals with your import for python files.
   * The command "pyformat.sortImports" will still be available even this is disabled.
   */
  pyformat.enableImportOrganization: boolean
}
```

## Format and sort imports on save
Adding the following settings in your project or global settings.
```typescript
  /** Enable format on save */
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    /** Pyformat use it's own code action to  */
    "source.organizeImports": true
  }
```

If you have multiple foramtters, you can specify which one you would like to use in or settings.
```typescript
 "[python]": {
    "editor.defaultFormatter": "giyyapan.pyformat"
  }
```

## license
MIT
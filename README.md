# Pyformat

Providing code formatting and import sorting for python codes using `autopep8` and `isort`.

Pyformat will read your "python.pythonPath" configuration to choose correct python environment.

If you don't have autopep8 and isort installed, Pyformat will ask and call `pip` to install them for you.

## Why
There's some reason that I can't use the official [vscode-python](https://marketplace.visualstudio.com/items?itemName=ms-python.python), so I created this extension for myself.

## Configuration
```typescript
{
  /**
   * Arguments passed to autopep8, defaults to ["--max-line-length 120"].
   * See https://github.com/hhatto/autopep8#configuration for more info.
   */
  pyformat.autopep8Args: string[]

  /**
   * Arguments passed to isort, defaults to [ "-w 120", "-m 2" ].
   * See https://github.com/timothycrosley/isort#configuring-isort for more info.
   */
  pyformat.isortArgs: string[]
}
```

## license
MIT
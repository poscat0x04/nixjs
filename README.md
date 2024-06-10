# NixJS

An experimental Nix to JavaScript transpiler.

## Motivation

Almost all Nix value types are available in JavaScript, so a direct translation from Nix to JavaScript is possible.
Additionally, laziness isn't hard to implement since JS is mutable and we are not dealing with parallelism.
Another motivation is to have an alternative implementation of the Nix language to serve as a
benchmark for cppnix (I personally am unsatisfied with its performance and memory usage).

There are also many potential benefits such as easier interfacing with any language that has
a WASM compiler, the ability to evaluate nix in the browser...

## Roadmap

- [x] "pure" Nix runtime
- [ ] Nix to JS codegen
- [ ] polish the cli tool
- [ ] Nix `builtins` runtime
- [ ] benchmarking against cppnix

## Potential Features

- embedding deno
- accelerated builtins using deno extensions
- interfacing with JS/WASM libraries
- flake support
- derivation support

# Custom Templates for the Angular Files Generato vscode extension

This folder contains custom templates for the Angular Files Generator extension. The script templates create repository tools; see [`tools/README.md`](../../tools/README.md) for the resulting tool layout and wrapper conventions.

The `.server.` templates use `server` as the custom template type. Select **Custom**, enter the feature name, then enter `server` to generate the server files together in that feature's output folder. They scaffold CRUD endpoints and the matching service, repository contract, Swagger DTOs, Zod validation, and a JSON file adapter. The generated example resource has a required `name` field; adapt it to the feature's domain.

The current Angular Files Generator replaces `__name__` in output filenames, but does not replace `__adaptertype__`. This template contains a JSON file adapter: after generation, rename the adapter file by replacing `__adaptertype__` with `json`. The module import path must use the same filename. Other storage technologies need their own adapter implementation.

Following the template pattern from

- https://marketplace.visualstudio.com/items?itemName=deniszholob.angular-files-generator#custom-templates
- https://github.com/deniszholob/angular-files-generator/tree/main/src/templates

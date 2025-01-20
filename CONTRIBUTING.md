# To contribute

**If you are working on an existing issue, please claim it with your comment, so there is no duplicate work.**

## What you will need before you begin:

1. Ensure [NodeJS](https://nodejs.org/) version 18.19.1 LTS or later is installed on your system.
2. Install [VSCode](https://code.visualstudio.com/) v1.74 or later
3. Install [pnpm](https://pnpm.io/) `npm install -g pnpm`
4. Clone the repository using git cli or ui like github desktop/sourcetree/gitkraken etc...
5. Open the cloned folder using VSCode and **install recommended extensions**
6. Run `pnpm run i` in the folder that you've just cloned to ensure you have all dependencies that are needed for development.
7. Run `pnpm run start` to start the dev server for the app

## Hidden Files in VSCode

Some files are hidden in vscode by default, see the `files.exclude` option in the [settings file](.vscode/settings.json)

There is a [recommended extension](.vscode/extensions.json) `adrianwilczynski.toggle-hidden` that allows to easily toggle hidden files on and off

## Storybook

You can reference any of the existing components in the storybook instance

- Run storybook via `pnpm run storybook` command
- You can then browse the list of components and use the docs to help you use them

## Where to find stuff/Project Structure

- This project uses [NX](https://nx.dev/) + [Angular](https://angular.dev/)
- The [global](./global/) folder contains css stylesheets and images/icons.
- All source code is in the [src](./src/) folder, most of other files/folders in the top level of the repo are just various configs for different tools (linting, formatting, testing etc...)
- The **MAIN CODE** is in the [app folder](./src/app/).
  - Most of the time any of the internal folders like [components](./src/app/components/) will be the place to edit and create new code
  - Here the [app.component.ts](./src/app/app.component.ts) is the main entry point for the angular app along with the other app.xxx.ts like routes.
- The [routes]
- The rest of the [src](./src/) folder contains the main [index.html](./src/index.html) which is where all the angular code gets generated to and is what is hosted. It also contains some basic resources like favicons and metadata for SEO.

## Writing code

When creating new components, services, utilities, etc...:  
Make sure to install and use the [Angular Files Generator Extension for VSCode](https://marketplace.visualstudio.com/items?itemName=deniszholob.angular-files-generator) (already enabled if you installed the recommended extensions)  
This will generate new files conforming to the project style: Depending on type selection; this will generate starter ts, html as well as storybook and jest test files making it easier to develop well documented and tested code.

Make sure all the typescript code is strongly typed everywhere. This makes it not only more robust but also documents the code better, and allows to quickly know what data types are used in any given place.

## Steps to follow when your work is ready:

When your work is done:

1. Run `pnpm run build`.
2. After a successful build, make a commit and push your changes. If you're fixing a existing issue: be sure to link to that issue in the git commit message, like so: `Closes #issueNumberThatGetsFixed`.
3. Create a new Pull Request.
4. Write a good description of the changes this pull-request will make.
5. You must provide screenshots if there is a visual change.

## Debug

- If you get an error with precommit hooks (Mac/Linux), see: https://stackoverflow.com/a/72279243

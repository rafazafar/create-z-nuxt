#! /usr/bin/env node
import inquirer from "inquirer";
import ora from "ora";
import exec from "await-exec";
import { promises as fs } from "fs";

console.log("Creating an opinionated Typescript Nuxt 3 project...");

(async () => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of your app?",
        default: "my-nuxt3-app",
        validate: function (value) {
          var pass = value.match(/^[a-zA-Z0-9-]+$/i);
          if (pass) {
            return true;
          }
          return "Please enter a valid name";
        },
      },
      {
        type: "input",
        name: "port",
        message: "Which localhost port do you want to use?",
        default: 3000,
      },
      {
        type: "checkbox",
        name: "ui-framework",
        message: "Which UI/CSS framework do you want to use?",
        choices: ["tailwindcss", "tailwindui", "element-ui", "daisyui"],
        default: ["tailwindcss"],
      },
      {
        type: "confirm",
        name: "use-state",
        message: "Do you want to use a Pinia state management?",
        default: false,
      },
      {
        type: "checkbox",
        name: "nuxt-modules",
        message: "Which Nuxt modules do you want to use?",
        choices: [
          "Robots",
          "Image",
          "Strapi",
          "Directus",
          "Supabase",
          "Apollo",
          "i18n",
          "Content",
        ],
        default: [],
      },
      //   {
      //     type: "checkbox",
      //     name: "plugins",
      //     message: "Which Plugins do you want to use?",
      //     choices: ["Vue Query"],
      //     default: ["Vue Query"],
      //   },
      {
        type: "list",
        name: "target",
        message: "Where will you deploy your app?",
        choices: [
          "node-server",
          "vercel",
          "netlify",
          "cloudflare",
          "aws-lambda",
        ],
        default: "node-server",
      },
    ])
    .then(async (answers) => {
      console.log("Your seclected configuration is: ");
      console.log(answers);

      await inquirer
        .prompt([
          {
            type: "confirm",
            name: "confirm",
            message: "Is this correct?",
            default: true,
          },
        ])
        .then(async (confirm) => {
          await fs.readdir("./", (err, files) => {
            files.forEach((file) => {
              console.log(file);
            });
          });

          if (confirm.confirm) {
            // install nuxt 3
            const spinner = ora("Install Nuxt 3").start();
            await exec(`npx nuxi init ${answers.name} --ts`);
            process.chdir(answers.name);
            await exec(`npm install`);
            spinner.succeed("Nuxt 3 added");

            // create folders from foldersToAdd
            const folderToAdd = [
              "content",
              "composables",
              "layouts",
              "middleware",
              "plugins",
            ];
            spinner.start("Create folders");
            folderToAdd.forEach(async (folder) => {
              await exec(`mkdir ${folder}`);
            });
            spinner.succeed("Folders created");

            // generate nuxt config
            let nuxtModules = "";
            let nuxtBuildModules = "";
            let nuxtOtherConfigs = "";
            let nuxtPlugins = "";
            await Promise.all(
              answers["ui-framework"].map(async (module) => {
                switch (module) {
                  case "tailwindcss":
                    spinner.start("Installing TailwindCSS");
                    nuxtModules += '"@nuxtjs/tailwindcss",\n';
                    await exec(`npm i -D @nuxtjs/tailwindcss`);
                    spinner.succeed("TailwindCSS added");
                    break;
                }
              })
            );

            if (answers["use-state"]) {
              spinner.start("Installing Pinia");
              nuxtModules += '"@pinia/nuxt",\n';
              await exec("npm i -D @pinia/nuxt");
              spinner.succeed("Pinia added");
            }

            for (const module of answers["nuxt-modules"]) {
              spinner.start(`Installing ${module}`).start();
              switch (module) {
                case "Robots":
                  await exec(`npm i @nuxtjs/robots`);
                  nuxtModules +=
                    '["@nuxtjs/robots",{UserAgent: "*", Disallow: "/"}],\n';
                  break;

                case "Image":
                  await exec(`npm i -D  @nuxt/image-edge`);
                  nuxtModules += '"@nuxt/image-edge",\n';
                  break;

                case "Strapi":
                  nuxtModules += '"@nuxtjs/strapi",\n';
                  nuxtOtherConfigs +=
                    'strapi: {\n  url: process.env.STRAPI_URL || "http://localhost:1337",\n  prefix: "/api",\n},\n';
                  await exec(`npm i -D @nuxtjs/strapi`);
                  break;

                case "Directus":
                  await exec(`npm i -D nuxt-directus`);
                  nuxtModules += '"nuxt-directus",\n';
                  nuxtOtherConfigs +=
                    'directus: {\n  url: process.env.DIRECTUS_URL || "http://localhost:8055",\n},\n';
                  break;

                case "Supabase":
                  await exec(`npm i -D @nuxtjs/supabase`);
                  nuxtModules += '"@nuxtjs/supabase",\n';
                  nuxtOtherConfigs +=
                    'supabase: {\n  url: process.env.SUPABASE_URL || "https://your-project.supabase.co",\n  key: process.env.SUPABASE_KEY || "<public-anon-key>",\n},\n';
                  break;

                case "Apollo":
                  await exec(`npm i -D @nuxtjs/apollo`);
                  nuxtModules += '"@nuxtjs/apollo",\n';
                  nuxtOtherConfigs += `apollo: {\n  clientConfigs: {\n    default: {\n      httpEndpoint: 'http://localhost:1337/graphql',\n    },\n  },\n},\n`;
                  break;

                case "i18n":
                  await exec(`npm i -D @nuxtjs/i18n`);
                  nuxtModules += '"@nuxtjs/i18n",\n';
                  break;

                case "Content":
                  await exec(`npm i -D @nuxt/content`);
                  nuxtModules += '"@nuxt/content",\n';
                  break;
              }
              spinner.succeed(`${module} added`);
            }

            // for (const plugin of answers["plugins"]) {
            //   spinner.start(`Installing ${plugin}`).start();
            //   switch (plugin) {
            //     case "Vue Query":
            //       await exec(`npm i @tanstack/vue-query`);
            //       await exec(`touch ./plugins/vue-query.js`);
            //       await fs.writeFile(
            //         "./vue-query.js",
            //         vueQueryPluginJS,
            //         (err) => {
            //           if (err) throw err;
            //         }
            //       );
            //       await exec(`cp -r node_modules/vue-query/dist .`);
            //       nuxtPlugins += '"~/plugins/vue-query.js",\n';
            //       break;
            //   }
            //   spinner.succeed(`${plugin} added`);
            // }

            // write nuxt modules to nuxt.config.ts
            let result = "export default defineNuxtConfig({\n";
            result += `  nitro: { preset: "${answers.target}" },\n`;
            result += `  devServer: {\n    port: ${answers.port},\n  },\n`;
            result += `  modules: [\n    ${nuxtModules}],\n`;
            // result += `  plugins: [\n    ${nuxtPlugins}],\n`;
            result += `  buildModules: [\n    ${nuxtBuildModules}],\n`;
            result += `  ${nuxtOtherConfigs}`;
            result += "})";

            await fs.writeFile(
              "nuxt.config.ts",
              result,
              "utf8",
              function (err) {
                if (err) return console.log(err);
              }
            );

            console.log("Completed. Happy coding!");
            console.log(`To start: cd ${answers.name} && npm run dev`);
          } else {
            console.log("Please run the npx command again.");
            return;
          }
        });
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.log(error);
      } else {
        console.log(error);
      }
    });
})();

const vueQueryPluginJS =
  'import e from"vue";import{VueQueryPlugin as t,QueryClient as u,hydrate as r}from"vue-query";export default(a=>{let i=new u({defaultOptions:{queries:{staleTime:5e3}}}),n={queryClient:i};e.use(t,n),process.client&&a.nuxtState&&a.nuxtState.vueQueryState&&r(i,a.nuxtState.vueQueryState)});';

#! /usr/bin/env node
import inquirer from 'inquirer';
import ora from 'ora';
import exec from 'await-exec';
import fs from 'fs';

console.log("Creating an opinionated Typescript Nuxt 3 project...");

(async () => {
inquirer
  .prompt([
    {
        type: 'input',
        name: 'name',
        message: 'What is the name of your app?',
        default: 'my-nuxt3-app',
        validate: function (value) {
            var pass = value.match(
                /^[a-zA-Z0-9-]+$/i
            );
            if (pass) {
                return true;
            }
            return 'Please enter a valid name';
            }
    },
    {
        type: 'input',
        name: 'port',
        message: 'Which localhost port do you want to use?',
        default: 3000
    },
    {
        type: 'checkbox',
        name: 'ui-framework',
        message: 'Which UI/CSS framework do you want to use?',
        choices: [
            'tailwindcss',
            'tailwindui',   
            'element-ui',
            'daisyui'
        ],
        default: ['tailwindcss'],
    },
    {
        type: 'confirm',
        name: 'use-state',
        message: 'Do you want to use a Pinia state management?',
        default: false,
    },
    {
        type: 'checkbox',
        name: 'nuxt-modules',
        message: 'Which Nuxt modules do you want to use?',
        choices: [
            'Robots',
            'Image',
            'Strapi',
            'Directus',
            'Supabase',
            'Apollo',
            'i18n',
            'Content',
        ],
        default: [],
        
    },
    {
        type: 'list',
        name: 'target',
        message: 'Where will you deploy your app?',
        choices: [
            'node-server',
            'vercel',
            'netlify',
            'cloudflare',
            'aws-lambda'
        ],
        default: 'node-server',
    },
  ])
  .then(async (answers) => {
    console.log("Your seclected configuration is: ");
    console.log(answers)
    
    await inquirer.prompt([{type: 'confirm', name: 'confirm', message: 'Is this correct?', default: true}]).then(async (confirm) => {
        if (confirm.confirm) {
            
            // install nuxt 3
            const spinner = ora('Install Nuxt 3').start();
            await exec(`npx nuxi init ${answers.name} --ts`)
            process.chdir(answers.name)
            await exec(`npm install`)
            spinner.succeed('Nuxt 3 added');

            // generate nuxt config
            let nuxtModules = ''
            let nuxtTypes = ''
            let nuxtBuildModules = ''
            let nuxtOtherConfigs = ''
            await Promise.all(answers['ui-framework'].map(async(module) => {
                switch(module) {
                    case 'tailwindcss':
                        spinner.start('Installing TailwindCSS');
                        nuxtModules += '"@nuxtjs/tailwindcss",\n' 
                        await exec(`npm i -D @nuxtjs/tailwindcss`)
                        spinner.succeed('TailwindCSS added');
                        break;
                }
            }))

            if(answers['use-state']) {
                spinner.start('Installing Pinia');
                nuxtModules += '"@pinia/nuxt",\n'
                await exec(`npm i -D @pinia/nuxt`)
                spinner.succeed('Pinia added');
            }

            for (const module of answers['nuxt-modules']) {
                spinner.start(`Installing ${module}`).start();
                switch(module) {
                    case 'Robots':
                        await exec(`npm i @nuxtjs/robots`)
                        nuxtModules += '["@nuxtjs/robots",{UserAgent: "*", Disallow: "/"}],\n'
                        break;
                    case 'Image':
                        await exec(`npm i -D  @nuxt/image-edge`)
                        nuxtModules += '"@nuxt/image-edge",\n'
                        break;
                    case 'Strapi':
                        nuxtModules += '"@nuxtjs/strapi",\n'
                        nuxtOtherConfigs += 'strapi: {\n  url: process.env.STRAPI_URL || "http://localhost:1337",\n  prefix: "/api",\n},\n'
                        await exec(`npm i -D @nuxtjs/strapi`)
                        break;
                    case 'Directus':
                        await exec(`npm i -D nuxt-directus`)
                        nuxtModules += '"nuxt-directus",\n'
                        nuxtOtherConfigs += 'directus: {\n  url: process.env.DIRECTUS_URL || "http://localhost:8055",\n},\n'
                        break;
                    case 'Supabase':
                        await exec(`npm i -D @nuxtjs/supabase`)
                        nuxtModules += '"@nuxtjs/supabase",\n'
                        nuxtOtherConfigs += 'supabase: {\n  url: process.env.SUPABASE_URL || "https://your-project.supabase.co",\n  key: process.env.SUPABASE_KEY || "<public-anon-key>",\n},\n'
                        break;
                    case 'Apollo':
                        await exec(`npm i -D @nuxtjs/apollo`)
                        nuxtModules += '"@nuxtjs/apollo",\n'
                        nuxtOtherConfigs += `apollo: {\n  clientConfigs: {\n    default: {\n      httpEndpoint: 'http://localhost:1337/graphql',\n    },\n  },\n},\n`
                        break;
                    case 'i18n':
                        await exec(`npm i -D @nuxtjs/i18n`)
                        nuxtModules += '"@nuxtjs/i18n",\n'
                        nuxtTypes += '"@nuxtjs/i18n",\n'
                        break;
                    case 'Content':
                        await exec(`npm i -D @nuxt/content`)
                        nuxtModules += '"@nuxt/content",\n'
                        break;
                }
                spinner.succeed(`${module} added`);
            }
            

            // write nuxt modules to nuxt.config.ts
            let result = "export default defineNuxtConfig({\n"
            result += `  nitro: { preset: "${answers.target}" },\n`
            result += `  devServer: {\n    port: ${answers.port},\n  },\n`
            result += `  modules: [\n    ${nuxtModules}],\n`
            result += `  buildModules: [\n    ${nuxtBuildModules}],\n`
            result += `  ${nuxtOtherConfigs}`
            result += "})"
            
            fs.writeFileSync('nuxt.config.ts', result, 'utf8', function (err) {
                if (err) return console.log(err);
            });

            console.log('Completed. Happy coding!');
            console.log(`To start: cd ${answers.name} && npm run dev`)
        } else {
            console.log("Please run the npx command again.")
            return
        }
    })
  })
  .catch((error) => {
    if (error.isTtyError) {
        console.log(error);
    } else {
        console.log(error);
    }
  })
})();
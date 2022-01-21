const core = require("@actions/core");
const { exec } = require("child_process");

async function buildDockerImage(
  dockerFilePath,
  dockerFileName,
  buildOptions,
  tag
) {
  try {
    console.log(`building docker image ...`);
    const output = await new Promise((resolve, reject) => {
      exec(
        `docker build -f ${dockerFilePath}/${dockerFileName} ${buildOptions} -t ${tag} .`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      );
    });
    console.log(output);
    console.log(`Docker image built successfully`);
  } catch (error) {
    core.setFailed(`Docker image built failed. Error: ${error.message}`);
  }
}

async function loginHeroku(email, password) {
  try {
    console.log(`Logging in ...`);
    const output = await new Promise((resolve, reject) => {
      exec(
        `echo ${password} | docker login --username=${email} registry.heroku.com --password-stdin`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      );
    });
    console.log(output);
    console.log(`Logged in successfully`);
  } catch (error) {
    core.setFailed(
      `Loggin in to heroku docker registry faild. Error: ${error.message}`
    );
  }
}

async function herokuAction(herokuApiKey, herokuAppName, formation, action) {
  try {
    console.log(`Performing heroku container action "${action}" ...`);
    const output = await new Promise((resolve, reject) => {
      exec(
        `HEROKU_API_KEY=${herokuApiKey} heroku container:${action} ${formation} --app ${herokuAppName}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      );
    });
    console.log(output);
    console.log(`Performing heroku container action "${action}" succeeded`);
  } catch (error) {
    core.setFailed(
      `Performing heroku container action "${action}" faild. Error: ${error.message}`
    );
  }
}

async function buildPushAndDeploy() {
  const herokuEmail = core.getInput("heroku_email");
  const herokuApiKey = core.getInput("heroku_api_key");
  const herokuAppName = core.getInput("heroku_app_name");
  const formation = core.getInput("formation");

  const dockerFileName = core.getInput("dockerfile_name");
  const dockerFilePath = core.getInput("dockerfile_path");
  const dockerOptions = core.getInput("docker_options");
  const dockerTag = `registry.heroku.com/${herokuAppName}/${formation}`;

  // create a docker image
  await buildDockerImage(
    dockerFilePath,
    dockerFileName,
    dockerOptions,
    dockerTag
  );

  // loging in to heroku registery
  await loginHeroku(herokuEmail, herokuApiKey);

  // pushing to heroku registery
  await herokuAction(herokuApiKey, herokuAppName, formation, "push");

  // releasing the heroku app
  await herokuAction(herokuApiKey, herokuAppName, formation, "release");
}

buildPushAndDeploy().catch((error) => {
  core.setFailed(error.message);
});

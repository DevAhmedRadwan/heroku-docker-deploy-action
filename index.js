const core = require("@actions/core");
const { exec } = require("child_process");

async function buildDockerImage(
  dockerFilePath,
  dockerFileName,
  buildOptions,
  tag
) {
  try {
    await exec(
      `docker build -f ${dockerFilePath}/${dockerFileName} ${buildOptions} -t ${tag} .`
    );
    console.log("Docker image built successfully");
  } catch (error) {
    core.setFailed(`Docker image built failed. Error: ${error.message}`);
  }
}

async function loginHeroku(email, password) {
  try {
    await exec(
      `echo ${password} | docker login --username=${email} registry.heroku.com --password-stdin`
    );
    console.log("Logged in successfully");
  } catch (error) {
    core.setFailed(
      `Loggin in to heroku docker registry faild. Error: ${error.message}`
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
  const dockerTag = `heroku-deploy-${herokuAppName}-${formation}`;

  // create a docker image
  await buildDockerImage(
    dockerFilePath,
    dockerFileName,
    dockerOptions,
    dockerTag
  );

  await loginHeroku(herokuEmail, herokuApiKey);
}

buildPushAndDeploy().catch((error) => {
  core.setFailed(error.message);
});

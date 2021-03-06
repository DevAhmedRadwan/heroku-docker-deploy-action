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

    let filePath = `${dockerFileName}`;
    if (dockerFilePath != "") filePath = `${dockerFilePath}/${dockerFileName}`;

    const output = await new Promise((resolve, reject) => {
      exec(
        `docker build -f ${filePath} ${buildOptions} -t ${tag} .`,
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

async function loginToHerokuRegistry(email, password) {
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

async function pushImageToHerokuRegistry(tag) {
  try {
    console.log(`pushing docker image ...`);
    const output = await new Promise((resolve, reject) => {
      exec(`docker push ${tag}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
    console.log(output);
    console.log(`Docker image pushed successfully`);
  } catch (error) {
    core.setFailed(`Docker image pushing failed. Error: ${error.message}`);
  }
}

async function releaseImage(herokuApiKey, herokuAppName, formation) {
  try {
    console.log(`Releasing pushed image ...`);
    const output = await new Promise((resolve, reject) => {
      exec(
        `HEROKU_API_KEY=${herokuApiKey} heroku container:release ${formation} --app ${herokuAppName}`,
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
    console.log(`Pushed image released successfully`);
  } catch (error) {
    core.setFailed(`Releasing pushed image faild. Error: ${error.message}`);
  }
}

async function buildPushAndDeploy() {
  const herokuEmail = core.getInput("heroku_email");
  const herokuApiKey = core.getInput("heroku_api_key");
  const herokuAppName = core.getInput("heroku_app_name");
  const formation = core.getInput("formation") || "web";

  const dockerFileName = core.getInput("dockerfile_name") || "dockerfile";
  const dockerFilePath = core.getInput("dockerfile_path") || "";
  const dockerOptions = core.getInput("docker_options") || "";
  const dockerTag = `registry.heroku.com/${herokuAppName}/${formation}`;

  // create a docker image
  await buildDockerImage(
    dockerFilePath,
    dockerFileName,
    dockerOptions,
    dockerTag
  );

  // loging in to heroku registery
  await loginToHerokuRegistry(herokuEmail, herokuApiKey);

  // pushing to image heroku registery
  await pushImageToHerokuRegistry(dockerTag);

  // releasing the heroku app
  await releaseImage(herokuApiKey, herokuAppName, formation);
}

buildPushAndDeploy().catch((error) => {
  core.setFailed(error.message);
});

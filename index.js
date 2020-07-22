const fs = require("fs");
const { google } = require("googleapis");

const TOKEN_PATH = "token.json";
const arguments = process.argv;
const data = arguments.slice(2);
const articleData = {
    url: data[0],
    heading: data[1],
};

const createArticle = ({ url, heading }) => {
    console.log("writing file...");
    const data = `\t\t\t${heading}\n\nLink: ${url}`;
    const file_name = `${heading}.txt`;
    const path = `articles/${file_name}`;

    try {
        fs.writeFileSync(path, data);
        console.log("file written successfully");
        return {
            name: file_name,
            path,
        };
    } catch (error) {
        console.error(error);
        return false;
    }
};

const uploadFile = ({ name = "", path }, auth) => {
    console.log("uploading file...");
    const drive = google.drive({ version: "v3", auth });
    const folderId = "1PgXSfweIM9G5O2Jvl2vvNiJH9WFoRNWs";
    const fileMetadata = {
        name,
        parents: [folderId],
    };
    const media = {
        mimeType: "text/plain",
        body: fs.createReadStream(path),
    };
    drive.files.create(
        {
            resource: fileMetadata,
            media: media,
            fields: "id",
        },
        (err, file) => {
            if (err) {
                console.error(err);
            } else {
                console.log(
                    "file uploaded:",
                    name.substring(0, name.length - 4)
                );
                console.log("file-id:", file.data.id);
            }
        }
    );
};

const main = (article) => {
    const raw_cred = fs.readFileSync("credentials.json");
    const parsed_cred = JSON.parse(raw_cred);
    const raw_token = fs.readFileSync(TOKEN_PATH);
    const parsed_token = JSON.parse(raw_token);
    const { client_secret, client_id, redirect_uris } = parsed_cred.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );
    oAuth2Client.setCredentials(parsed_token);

    const fileData = createArticle(article);
    if (fileData) {
        uploadFile(fileData, oAuth2Client);
    }
};

main(articleData);

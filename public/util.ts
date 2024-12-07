type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json" | "file";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type Operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

// // At the top of util.ts
// declare const transformers: any;

/**
 * This list of operations is used to generate the manual testing UI.
 */
const operations: Operation[] = [
  //////////////////// Session ////////////////////////////////////////
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  //////////////////// Authenticate ////////////////////////////////////////
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Update Password",
    endpoint: "/api/users/password",
    method: "PATCH",
    fields: { currentPassword: "input", newPassword: "input" },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Set Step Size (type a number between 1-5)",
    endpoint: "/api/users/step",
    method: "PATCH",
    fields: { stepSize: "input" },
  },

  //////////////////// Post ////////////////////////////////////////
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "See Post Photo!",
    endpoint: "/api/posts/single/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input", photo: "file" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", content: "input", options: { backgroundColor: "input" } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  //////////////////// Comment ////////////////////////////////////////
  {
    name: "Comment",
    endpoint: "/api/comments",
    method: "POST",
    fields: { postId: "input", content: "input" },
  },
  {
    name: "Edit Comment",
    endpoint: "/api/comments/:id",
    method: "PATCH",
    fields: { id: "input", content: "input" },
  },
  {
    name: "Delete Comment",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Comments (empty for all)",
    endpoint: "/api/comments",
    method: "GET",
    fields: { postId: "input" },
  },

  //////////////////// Friend ////////////////////////////////////////

  //////////////////// Auto Captioning ////////////////////////////////////
  {
    name: "Generate AutoCaption",
    endpoint: "/api/autocaptions",
    method: "POST",
    fields: { postId: "input" },
  },
  {
    name: "Get AutoCaptions (empty for all)",
    endpoint: "/api/autocaptions",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Update AutoCaptions",
    endpoint: "/api/autocaptions/update/:postid",
    method: "PATCH",
    fields: { postid: "input" },
  },

  //////////////////// Stepping ////////////////////////////////////

  //////////////////// Suggesting ////////////////////////////////////
  //
  // ...
  //
];

/*
 * You should not need to edit below.
 * Please ask if you have questions about what this test code is doing!
 */

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag === "file" ? "input type='file'" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}
//
//
//
//
async function createImageFromBase64(base64ImageData: string): Promise<HTMLImageElement> {
  // Ensure the base64 string has the correct data URL prefix
  if (!base64ImageData.startsWith("data:image")) {
    // Assuming the image is in JPEG format; adjust the MIME type if necessary
    base64ImageData = `data:image/jpeg;base64,${base64ImageData}`;
  }

  // Create an Image object from the base64 string
  const img = new Image();
  img.src = base64ImageData;

  // Wait for the image to load
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (error) => reject(error);
  });

  return img;
}
//
// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
//
//
//
//
//
//
//
async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);

  //
  const pairs = Object.entries(reqData);
  const hasFile = Object.values(reqData).some((value) => value instanceof File);

  // If there's a file, convert the file to a base64 string
  let data: any;
  if (hasFile) {
    const fileInput = pairs.find(([_, value]) => value instanceof File)?.[1] as File;
    const base64String = await fileToBase64(fileInput); // <---- The base64 string is temporarily stored here
    // console.log("Base64 String: ", base64String);
    reqData.photo = base64String;
    data = prefixedRecordIntoObject(reqData as Record<string, string>);
  } else {
    for (const [key, val] of pairs) {
      if (val === "") {
        delete reqData[key];
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
      if (type === "json") {
        reqData[key] = JSON.parse(val as string);
      }
    }
    data = prefixedRecordIntoObject(reqData as Record<string, string>);
  }

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, data);

  // Only trigger the photo display for the "See Post Photo" operation
  if (op?.name === "See Post Photo") {
    displayResponse(response.$response);
    updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
  } else {
    // Handle other responses normally (if you need to handle differently)
    updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
  }
}
//
//
//
//
//

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});

//
//
//
//
//
//
//
//

async function displayResponse(response: any) {
  console.log("Response received:", response); // Log the response to inspect the structure

  const pictureContainer = document.querySelector("#picture-container");

  if (!pictureContainer) {
    console.error("Picture container not found!");
    return;
  }

  pictureContainer.innerHTML = ""; // Clear previous response
  const post = Array.isArray(response) && response.length > 0 ? response[0] : null; // Check if the response is an array and access the first post
  const contentDiv = document.createElement("div"); // Create a div to display the content and photo

  if (!post) {
    contentDiv.innerHTML = "<p>No post available.</p>";
    pictureContainer.appendChild(contentDiv);
    return;
  }

  contentDiv.innerHTML = `<p>Content: ${post.content ?? "No content available"}</p>`;

  // If there's a photo, display it
  if (post.photo) {
    const img = await createImageFromBase64(post.photo);
    img.alt = "Uploaded Image";
    img.style.maxWidth = "300px"; // You can adjust the size
    contentDiv.appendChild(img);
  } else {
    contentDiv.innerHTML += "<p>No photo available.</p>";
  }

  // Append the contentDiv to the responseContainer
  pictureContainer.appendChild(contentDiv);
}

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongoClient } from "./db";
import https from "node:https";
import dns from "node:dns";


async function sendEmail(to: string, subject: string, html: string) {
  const body = JSON.stringify({
    from: "Bombatique <onboarding@thehnh.tech>",
    to: [to],
    subject,
    html,
  });

  const response = await new Promise<{ statusCode?: number; text: string }>((resolve, reject) => {
    const req = https.request(
      "https://api.resend.com/emails",
      {
        method: "POST",
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        lookup(hostname, options, callback) {
          dns.resolve4(hostname, (err, addresses) => {
            if (err) return callback(err, "", 4);
            const address = addresses[0];

            if (options.all) {
              return callback(null, [{ address, family: 4 }]);
            }

            return callback(null, address, 4);
          });
        },
      },
      (res) => {
        let text = "";

        res.on("data", (chunk) => {
          text += chunk;
        });

        res.on("end", () => {
          resolve({ statusCode: res.statusCode, text });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Resend request timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Resend error ${response.statusCode}: ${response.text}`);
  }

  console.log("[sendEmail] sent successfully:", response.text);
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(mongoClient.db("bombatique"), {
    client: mongoClient,
    transaction: false,
  }),  
  plugins: [
    magicLink({
  sendMagicLink: async ({ email, url }) => {
    console.log("[magicLink] email:", email);
    console.log("[magicLink] url:", url);

    await sendEmail(
      email,
      "Your magic link 🔥",
      `<div>
        <h1>Bombatique 💣</h1>
        <p>Click the link below to sign in.</p>
        <a href="${url}">Sign in</a>
      </div>`
    );
  },
}),
    nextCookies(),
  ],
  user: {
    additionalFields: {
      handle: { type: "string", required: false },
      school: { type: "string", required: false },
      schoolInitial: { type: "string", required: false },
      year: { type: "string", required: false },
      subjects: { type: "string[]", required: false },
      notificationsEnabled: { type: "boolean", defaultValue: true },
      isGuest: { type: "boolean", defaultValue: false },
      onboardingComplete: { type: "boolean", defaultValue: false },
      elo: { type: "number", defaultValue: 1000 },
      streak: { type: "number", defaultValue: 0 },
      gamesPlayed: { type: "number", defaultValue: 0 },
      gamesWon: { type: "number", defaultValue: 0 },
    },
  },
});

export type Auth = typeof auth;

import { Client, Collection, Message } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import bent from "bent";

config();

const token = getenv("TOKEN");
const channelid = getenv("CHANNEL");

if (!token) envdie("TOKEN");
if (!channelid) envdie("CHANNEL");

const client = new Client();
client.login(token);

client.on("ready", async () => {
   // DO STUFF

   // fetch channel and validate type
   process.stdout.write("getting channel... ");
   const channel = await client.channels.fetch(`${channelid}`);
   if (!channel.isText()) die("channel isnt a text channel!");
   console.log("done");

   // fetch all messages
   process.stdout.write("getting messages... ")
   const allmsgs: Array<Message> = [];
   let before: string | undefined = undefined;
   while (true) {
      const msgs: Collection<string, Message> = await channel.messages.fetch({ limit: 50, before });
      if (msgs.size === 0) break;

      process.stdout.write("h ");

      allmsgs.push(...Array.from(msgs.values()));
      before = msgs.lastKey();
   }
   console.log("done");

   // verify that there are messages in this channel
   if (allmsgs.length === 0) return disconnectdiscord() && void console.log("no messages found in this channel!");

   allmsgs.reverse(); // start from oldest and go to newest
   const getter = bent("buffer", 200);
   const images: Array<{
      issusurl: false;
      name: string;
      url: string;
      buffer: Buffer;
      messageid: string;
      hassizemismatch: boolean;
   } | {
      issusurl: true,
      messageid: string;
      msgcontent: string;
   }> = [];

   process.stdout.write("fetching attachments... ");
   for (const msg of allmsgs) {
      // fetch all attachments
      for (const attachment of msg.attachments.array()) {
         process.stdout.write("h ");
         const buffer = await getter(attachment.url);
         images.push({
            issusurl: false,
            name: attachment.name ?? "unnamed",
            url: attachment.url,
            buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
            messageid: msg.id,
            hassizemismatch: buffer.byteLength !== attachment.size
         });
         attachment.name
      }
      // quick and dirty scan for urls in the message
      // could be improved but for now, meh
      if (/https?:\/\//im.test(msg.content)) {
         process.stdout.write("h ");
         images.push({
            issusurl: true,
            messageid: msg.id,
            msgcontent: msg.content
         });
      }
   }
   console.log("done");

   disconnectdiscord();
   console.log("disconnected from discord");

   // write the files to disk
   process.stdout.write("writing images... ");
   /** file that contains manifest information and stuff about the files */
   const reportfile: Array<string> = [];
   const dir = mkdir(path.resolve(process.cwd(), `./images/${Date.now()}`));

   for (const img of images) {
      reportfile.push(`message id: ${img.messageid}`);
      if (img.issusurl) {
         reportfile.push(`suspected url!\n============== FILE CONTENTS =============\N${img.msgcontent}==========================================`);
      } else {
         reportfile.push(`url: ${img.url}`);
         img.hassizemismatch && reportfile.push("has a size mismatch");
         fs.writeFileSync(path.resolve(dir, `./${img.messageid}_${img.name}`), img.buffer);
      }
      reportfile.push("");
   }

   fs.writeFileSync(path.resolve(dir, "./__REPORT.txt"), reportfile.join("\n"));
   console.log("done");
});

function die(msg: string): never {
   console.error(msg);
   process.exit(64);
}
function getenv(env: string): string | false {
   return process.env[env] ?? false;
}
function envdie(env: string): never {
   die(`process.env["${env}"] doesn't exist!!!`);
}
function mkdir(dir: string): string {
   if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      return dir;
   }

   // exists
   let i = 0;
   let newdir = `${dir}-${i}`;

   while (fs.existsSync(newdir)) {
      i++;
      newdir = `${dir}-${i}`;
   }

   fs.mkdirSync(newdir);
   return dir;
}
function disconnectdiscord() {
   client.destroy();
   return true;
}

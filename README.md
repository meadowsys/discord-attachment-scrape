# discord-attachment-scrape

fetches all the messages from a channel and downloads their attachments

## usage

1. `git clone https://github.com/autumnblazey/discord-img-scrape.git && cd discord-img-scrape` - clones this repo and goes into the directory
2. `pnpm i` - installs dependencies
3. `cp .env.example .env` - copies the env example file. fill this out with a bot token of a bot that has access to this channel and the channel id of the channel that you want to get images from
4. `pnpm run build` - builds this program
5. `pnpm start` - starts the bot
6. wait for a bit...
7. output images in `images` dir, with a report of what it found and got in `__REPORT.txt`

## additional notes

- sometimes someone pastes a link instead, theres a very basic url detection filter thatll paste the message contents into `__REPORT.txt` if it thinks there might be a link in it
- may or may not need a lot of ram. for now it stores all the images into memory before writing them to the disk in one batch. When I ran it with about 64 images and messages, node used up over 250MB of ram
- this is legal and with the TOS, its using a bot account and discord's official API

## why?

L&T screenshot contest over, I don't want to download all those images manually so here we are

# British Council source verification

Checked on 18 October 2026 against official British Council pages. This is a practical source and implementation note, not legal advice.

## Selected lessons

`content-bc.json` contains twelve lesson cards: six B1 and six B2. Exact English titles and official level classifications were checked on the lesson pages and the [B1 catalogue](https://learnenglish.britishcouncil.org/free-resources/listening/b1) / [B2 catalogue](https://learnenglish.britishcouncil.org/free-resources/listening/b2). The older `/skills/listening/b1-listening` and `/b2-listening` catalogue URLs redirect to `/free-resources/listening/b1` and `/b2`.

The Russian titles, short descriptions, skill focus and listening prompts are newly written for this app. They are not copies or translations of British Council exercise questions. No transcript, worksheet, image, recording or media URL has been included in the app data.

| ID | Level | Official page |
| --- | --- | --- |
| bc01 | B1 | [An interview about listening skills](https://learnenglish.britishcouncil.org/free-resources/listening/b1/interview-about-listening-skills) |
| bc02 | B1 | [At the chemist](https://learnenglish.britishcouncil.org/free-resources/listening/b1/chemist) |
| bc03 | B1 | [Work–life balance](https://learnenglish.britishcouncil.org/free-resources/listening/b1/work-life-balance) |
| bc04 | B1 | [A team meeting about diversity](https://learnenglish.britishcouncil.org/free-resources/listening/b1/team-meeting-about-diversity) |
| bc05 | B1 | [Chatting about a series](https://learnenglish.britishcouncil.org/free-resources/listening/b1/chatting-about-series) |
| bc06 | B1 | [An introduction to a lecture](https://learnenglish.britishcouncil.org/free-resources/listening/b1/introduction-lecture) |
| bc07 | B2 | [Creating a study group](https://learnenglish.britishcouncil.org/free-resources/listening/b2/creating-study-group) |
| bc08 | B2 | [A digital detox podcast](https://learnenglish.britishcouncil.org/free-resources/listening/b2/digital-detox-podcast) |
| bc09 | B2 | [Film reviews](https://learnenglish.britishcouncil.org/free-resources/listening/b2/film-reviews) |
| bc10 | B2 | [A business interview](https://learnenglish.britishcouncil.org/free-resources/listening/b2/business-interview) |
| bc11 | B2 | [A talk about motivation](https://learnenglish.britishcouncil.org/free-resources/listening/b2/talk-about-motivation) |
| bc12 | B2 | [A lecture about an experiment](https://learnenglish.britishcouncil.org/free-resources/listening/b2/lecture-about-experiment) |

All twelve canonical lesson pages returned their titles and contents in the research session. A later read of the work–life page timed out; its content was also verified through the same official page's [comment pagination](https://learnenglish.britishcouncil.org/free-resources/listening/b1/work-life-balance?page=15). No access bypass was used. Verification here concerns source pages, not a completed playback test.

## Current terms and embedding conclusion

The official [Terms of use](https://www.britishcouncil.org/terms), displayed as last updated 29 May 2020, were checked through the official domain's current indexed page after direct fetches timed out.

Sections 10 and 14 allow personal, noncommercial use with attribution and applicable notices; ordinary text links to free British Council pages are generally accepted. They reserve prior written permission for republishing content on another website, separating audio from its accompanying text, copying parts into other products, and publishing direct content links outside their service context. Section 19 says revised terms take effect when displayed.

No explicitly authorized embed player or public embedding permission was found in the inspected B1/B2 lesson pages or official site searches. A technically accessible audio URL or iframe would not establish permission. Therefore the planned public app should link to the complete original lesson for British Council playback, transcript and exercises, using the attribution `British Council — LearnEnglish`.

A generic local audio import can support a user's own or appropriately licensed audio. Store imported blobs in IndexedDB on the user's device; do not upload, include in Git, publish, export or service-worker-cache British Council recordings. Retain the associated original-page link and attribution when a user labels an imported recording as British Council. Local storage alone should not be presented as blanket permission to use British Council audio apart from its accompanying text; the original lesson remains the intended BC playback route. No BC-specific downloader or media scraper should be added.

## Content currency

These are language-learning materials. `A lecture about an experiment` contains historical time-relative narration (including an expectation concerning the 2020s); `A talk about motivation` contains broad claims about automation and incentives. Do not present either as a verified 2026 scientific update or clinical evidence. Their cards deliberately practise chronology and evaluating an argument without repeating those claims as current facts. `At the chemist` is a language dialogue, not a prescribing guide.

## Concise product wording

Suggested source action: **Слушать на British Council**.

Suggested explanation: **Оригинальная запись и текст открываются на странице British Council. Здесь — ваш маршрут повторения и личные заметки.**

Suggested independent importer label: **Добавить своё аудио**.

Avoid claiming official partnership, approval, embedded British Council audio, or offline availability of their recordings.

# digital-ema Technical Summary

## 1. Overview
- **Title**: digital-ema
- **Production Date**: April 2026
- **Public URL**: [https://script.google.com/a/macros/seisei-edu.jp/s/AKfycbzfW32VnrVEP8G0kaJj4rB1shHH12U2lxwfNG-LLs_ZRFSH8LibAie7E_dhk3t08TdA7w/exec]
- **Repository**: [https://github.com/shimataiyaki/digital-ema ]

## 2. Development Background

### 2.1 Concept and Purpose
- Developed and provided to a club for a high school cultural festival exhibition themed around “Shinto shrines,” with the goal of creating **“an experience where visitors can offer their own wishes and share them in real time.”**
- Unlike traditional paper ema, the project emphasized **the immediacy and shareability unique to digital media** and was conceived as an installation utilizing large monitors.
- By leveraging Google services, we adopted a design that eliminates the need for building a dedicated server.

### 2.2 Prototyping Evolution
- **Conceptual Phase**: Considered a simple digital ema using “direct Google Spreadsheet display.” Faced challenges with real-time functionality and design.
- **v1 (GAS Web App Version)**: Built a dynamic display system using Google Apps Script. Implemented ema card designs and automatic update functionality.
- **v2 (Nickname Support Version)**: Added a nickname field to the form and implemented a feature to display wishes as “○○'s Wish.” This improved the personalization of the ema.
- **v3 (Operational Optimization Version)**: Adjusted the refresh interval to 20 seconds to ensure sufficient buffer against GAS execution limits (90 minutes/day). Added credits and links to the footer, enhancing the product’s polish.
- **v4–6**: Experimental specifications for beta development
- **v7 (Beta)**: To meet client requests, created an archive displaying all posts and expanded the number of posts displayed simultaneously to 20. Added a feature to notify users of new posts in real time.

## 3. Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets
- **Forms**: Google Forms
- **Hosting**: GAS Web App
- **Editor**: Google Apps Script Editor / Cursor (AI-assisted development)

## 4. System Architecture Diagram

[Chromebook (form input)] → [Google Forms] → [Spreadsheet (automatic accumulation)]
                                                              ↓
[Large monitor (connected to PC)] ← [GAS Web App (ema display)] ← [GAS (data retrieval)]

## 5. Technical Explanation

### 5.1 Development Process and Lessons Learned
- **Practical AI-Assisted Development**: This project was created using a style that involves clarifying requirements, generating code, and debugging through interaction with AI. This demonstrated that even programming beginners can complete a practical web app in a short period of time.
- **Utilizing No-Code/Low-Code Solutions**: The integration between Google Forms and Spreadsheets was implemented using no-code tools, and by using GAS solely for the display logic, we significantly reduced development effort.

### 5.2 Data Flow and Update Logic
- **Form Submission → Spreadsheet**: Using Google Forms’ standard features, responses are added to the spreadsheet in real time.
- **Data Retrieval via GAS**: The `getLatestWishes()` function retrieves the latest 6 entries from the spreadsheet and returns them to the frontend in JSON format.
- **Automatic Updates**: Designed to re-fetch data every 20 seconds using JavaScript’s `setInterval()` and update the DOM incrementally. Update frequency is optimized to account for GAS’s execution time limit (90 minutes per day).

### 5.3 UI/UX (Visual Representation of Ema)
- **Ema Card Design**: Ema are recreated using CSS. The `::before` pseudo-element is used to represent the “hole” and “string” at the top, and `box-shadow` is used to create a three-dimensional effect.
- **Vertical Writing Support (Optional)**: Adding `writing-mode: vertical-rl` enables a more authentic ema display.
- **Responsive Design**: Using CSS Grid, the ema card is designed to wrap based on screen size. While designed for full-screen display on large monitors, it also supports viewing on smartphones.

### 5.4 Operational Design
- **Compatibility with School ICT Environments**: As a web application, no special software or apps need to be installed, and it can be accessed from school Chromebooks.
- **Vandalism Prevention**: The form URL is set to private (accessible only to those who know the link) to prevent submissions from the general public.

## 6. Development Challenges and Solutions

| Challenge | Solution |
|:---|:---|
| GAS Execution Time Limit (90 minutes/day) | Designed with a 20-second refresh interval to ensure total execution time remains within approximately 36 minutes, even during a 6-hour operation. Manual reloading is also available as a fallback. |
| Network Load | The GAS web app only delivers HTML/CSS/JS, keeping data transmission to a minimum. Stable operation is expected even under the Wi-Fi conditions on the day of the cultural festival. |

## 7. Future Outlook
- Through the actual cultural festival exhibition, we plan to collect visitor feedback and identify operational challenges (such as perceived wait times and the number of ema displayed) to implement improvements.

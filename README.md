# Instagram Follower Email Extractor

> ⚠️ **WARNING!**: This project is for educational and research purposes only. Using this software for mass data extraction from Instagram violates Instagram's Terms of Service.

---

## Description

This tool automates the process of identifying email addresses associated with Instagram profiles that follow a specific user. It utilizes web scraping techniques via Selenium to:

1.  Log in to Instagram using provided credentials.
2.  Navigate to the target profile.
3.  Extract the follower list.
4.  Visit each follower's profile.
5.  Search for email addresses in their bios.
6.  Save the results in CSV format.

---

## Repository Structure

-   **ExtractorCorreosInstagram.py**: Main script containing all data extraction logic.
-   **requirements.txt**: Dependency file (Selenium).
-   **seguidores.txt**: Stores the list of follower usernames.
-   **emails_encontrados.txt**: Saves emails found during execution.
-   **instagram_emails.csv**: CSV file with results (username, email, profile URL).

---

## Features

-   **Automatic Login**: Handles cookies and login forms.
-   **Follower Extraction**: Automatic scrolling to load all followers.
-   **Email Detection**: Advanced algorithms to identify emails in various formats:
    -   Standard emails (example@domain.com)
    -   Anti-bot protected emails ([at], (at), arroba, etc.)
    -   Emails with prefixes (email:, correo:, etc.)
-   **Rate Limiting**: Random pauses to prevent blocking.
-   **Error Handling**: Automatic screenshots upon detecting issues.

---

## Requirements

-   Python 3.6+
-   Selenium
-   Chrome for testing (Chrome WebDriver)

---

## Installation

1.  Clone this repository.
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    -   Windows: `venv\Scripts\activate`
    -   Linux/Mac: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Download and install Chrome WebDriver:
    -   Visit https://chromedriver.chromium.org/downloads or https://googlechromelabs.github.io/chrome-for-testing/
    -   Download the Chrome WebDriver version that exactly matches your Chrome browser version.
    -   You should download the binary from the "chrome" column.
    -   To verify your Chrome version, open Chrome and go to: ⋮ > Help > About Google Chrome.
    -   Unzip the downloaded file and save the executable to a known location.
    -   You must provide the absolute path to the `chrome.exe` (or `chromedriver` executable on Linux/Mac).
    -   This executable path is what you will need to provide when running the script.

---

## Usage

1.  Execute the main script:
    ```bash
    python ExtractorCorreosInstagram.py
    ```
2.  Enter your Instagram username and password.
3.  Provide the URL of the profile whose followers you wish to analyze.
4.  Specify the full path to the Chrome WebDriver executable.

---

## Output Files

-   **instagram_emails.csv**: Contains three columns: Username, Email, Profile URL.
-   **seguidores.txt**: A simple list of follower usernames.
-   **emails_encontrados.txt**: Found emails in "username: email@example.com" format.

---

## Legal Disclaimers

-   This software should only be used with profiles where you have explicit permission from the owner.
-   Mass data extraction violates Instagram's Terms of Service.
-   Misuse may result in the suspension of your Instagram account.
-   The author is not responsible for any misuse of this tool.

---

## Limitations

-   Instagram may detect automated behavior and block the session.
-   The tool is limited to processing 100 profiles per execution to mitigate restrictions.
-   Not all users have visible emails in their profiles.

---

## Technical Notes

The script employs waiting techniques, random pauses, and human-like behavior simulation to reduce the likelihood of bot detection. However, there is no guarantee that Instagram will not detect automated activity.

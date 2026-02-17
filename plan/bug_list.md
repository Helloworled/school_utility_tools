**This file is constantly changing depended on the current bug:**

**Please fix the bugs mentioned below. When finished, please add a simple summary of the bug fix in the respond section.**

**You are permitted to use "eslint disable" command if necessary, please mention the fix in the respond.**

---

**Description:**

~~(now, when refreshing the page, the semi-auth session will dissapear, which is not according to design. According to design: the semi-auth token is only disabled (deleted in backend) once the websocket ping is not connected, it has no expire date, in frontend or backend (if the user wants, it can stay authenticated indefinently). the frontend token will just be there indefinently until next login when it updates. not important rught now)~~

File_storage:

1. chinese character file names will get messed up.
2. ~~cannot create subfolders inside a folder: will create backend error: Error creating folder: ReferenceError: parentFolder is not defined~~ FIXED: Moved parentFolder declaration outside the if block to fix scope issue in backend/routes/fileStorage.js line 445.
3. no visible page/button to see deleted files (trash-can). this is a minor feature flaw, can be ignored for now
4. ~~the public file system is not working as intended: the file-upload and folder-create will respond with a success state (no error, no warning), but nothing is created and showed up (the /files/public dictionary is still empty)~~ FIXED: Modified getUserUploadDir function in backend/utils/fileStorage.js to handle public type correctly by returning BASE_UPLOAD_DIR/public instead of BASE_UPLOAD_DIR/public/userId.
5. about the file share system:
   1. 无需认证：
      1. the logic is that this file is compleately free: no any authentication is required.
      2. now: if visiting the link, the browser will throw: router: no such path.
   2. 需要密码：
      1. the logic should be that this file is only accessable to users who have proper account and logined. The password is also required. when visiting the link, will check for if logined, and reqiure the password. can have a dedicated file-share page and api, router to manage this.
   3. ~~需要访问码：~~
      1. ~~this is accessable for (and only for) people who have passed the semi-auth section, see bellow. it is not accessable for other users even if they logined.~~
      2. this feature is not needed
6. semi-auth page: (is buggy, needs further testing)
   1. a page where the person can have access to the user's (the user name that they entered for login) public file folder.
   2. they can have limited modify access to user's public folder: they can create folders and upload files, download files.

**Frontend bugs:**

NONE

**Backend bugs:**

NONE

**Respond:**

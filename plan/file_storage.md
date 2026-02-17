General file storage info:

each user will have: a public folder(can ba accessed by non-system-user via authenticate code) and a private folder(for the user only). share files will be done via share link, the link can be set to require auth (account & pwd), semi-auth (auth code sent to user via), or no auth.

a system like google drive:

1. file system can support "infinent"(actually 32 layers, or less) layers of folders.
2. can support: batch opperation, CRUD service(see bellow),

file system tree:

* uploads/files/
  * private
    * [userid]
      * [folderid] (folderid will be: folder_[db id] instead of a custom generated uuid)
        * [fileid] (fileid will be: file_[db id] instead of a custom generated uuid)
  * public
    * [userid]
      * [folderid] (folderid will be: folder_[db id] instead of a custom generated uuid)
        * [fileid] (fileid will be: file_[db id] instead of a custom generated uuid)

Private CRUD sevice:

1. files will be upload to backend/uploads/file/ and to /private[userId] or public[userId] or shared depended on file type. The file/folder name will be restricted to only contain certain charactors.
2. FileView page:
   1. can see list of files, changable between private, public, shared
   2. can upload files: drag&drop, regular upload.
   3. can manage files:
      1. create folders
      2. create certain kind of files.
      3. move files
      4. "delete" files (not real delete, just make them invisible by editing db index and moving file to /file/deleted~~, also rename file to its original name before performing all of the above actions(1: rename 2:del db index 3:move file)~~)
3. FileDetail:
   1. can live preview certain sort of file (eg. PDF, docx, xlsx, pptx, txt, zip(use some kind of frontend zip library), etc.)
   2. can toggle file type (private/public/share).

Public file service:

1. ~~a small authentication system (use sessions only)~~ This system is already implemented, please use the semi-auth system:
   1. when first login, input a username.
   2. send a verification code to that private user via notification system (create notification).
   3. after login, use sessions to ensure login status.
   4. if possible, can create some mecanism to check is the user has closed the tab/page (either ping or websocket(if possible.)), if tab closed, delete session token
   5. will login to the private user's "public" folder
2. public view file page can only access /backend/upload/file/public[userid] files with type being: "public", and can only download file with "downloadable=true".

~~Shared file service:~~

~~same with private, except with no delete or move file (can only download and)~~

Shared folder will not be used, use share links instead

File system:

1. all files/created-folders will be renamed to a unique file id and moved to its designated folder (depended on its type).(file: File_[id], folder: Folder_[id])
2. only one share folder, but private folders will be named: private_[userId]. (to prevent putting all user's file in the same place5)
3. file db index:

   1. id
   2. user id: the user who uploaded the file.
   3. file id: the file id
   4. name: the original file name
   5. path: "/"for files directly in: public/private/share, this value stores excess file path (used for downloading file)
   6. type: "private/public/share"
   7. parentId: 父文件夹ID (null表示根目录)
   8. createdAt: 创建时间
   9. updatedAt: 最后修改时间
   10. isDeleted: 是否已删除 (布尔值)
4. folder db index:

   1. id: 唯一标识符 (UUID)
   2. userId: 创建该文件夹的用户ID
   3. folderId: 文件夹的唯一ID (UUID)
   4. name: 文件夹原始名称
   5. path: 文件夹路径 (如: "/documents/work") (used for downloading file.)
   6. type: "private/public/share"
   7. parentId: 父文件夹ID (null表示根目录)
   8. createdAt: 创建时间
   9. updatedAt: 最后修改时间
   10. isDeleted: 是否已删除 (布尔值)

backup:

there will be a json file in /uploads/file to keep track of all file/folder id and their names (the file system tree), this is to ensure if anything happening to the db, i can restore the file names to a more sensical state. The json files is only responsible to track the file name instead of its content.

**Redesign:**

I want sth. like google drive or baidu drive, instead of my design now.

Chat:

目前问题：所有文件夹都是靠数据库方式储存的，但是这样无法处理大量数据，区分主次目录也有困难。请问能否实现：所有文件夹和文件都会被正常创建在文件系统中，名字都是对应的id (eg. uploads/ file/ public/ [userid]/ [fileid]/ [fileid])，数据库只是做索引用，用于加载文件名，不存储具体文件系统结构。当需要访问某一目录时，使用类似dir的命令列出所有文件（预计用户只有1-10，所以不会有性能问题），并使用类似mem buffer的东西对数据进行缓存，加速同一目录访问。请问这个系统是否现实，会遇到什么潜在问题

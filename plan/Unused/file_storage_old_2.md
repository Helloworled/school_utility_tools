***PLEASE STOP READING FROM HERE:***

Detailed Info:

## 0. General Info:

DB: mongoDB

## 1. Private CRUD Service

### 1.1 File Upload System

#### API Endpoints

-**Upload Single File**: `POST /api/files/upload`

- Headers: `Content-Type: multipart/form-data`
- Body: `file` (File), `type` (string: "private/public/share"), `parentId` (string, optional)
- Response: `{ fileId, name, size, mimeType, storagePath }`

-**Upload Multiple Files**: `POST /api/files/upload/multiple`

- Headers: `Content-Type: multipart/form-data`
- Body: `files[]` (File array), `type` (string), `parentId` (string, optional)
- Response: `[{ fileId, name, size, mimeType, storagePath }, ...]`

#### File Storage Structure

```

backend/upload/file/

├── private_[userId]/

│   ├── File_[uuid]

│   └── Folder_[uuid]/

├── public/

│   ├── File_[uuid]

│   └── Folder_[uuid]/

└── share/

    ├── File_[uuid]

    └── Folder_[uuid]/

```

#### File Naming Convention

- Files: `File_[fileid]` (e.g., File_697f04c3ef26fa28050bb2c5)
- Folders: `Folder_[fileid]` (e.g., Folder_697f04c3ef26fa28050bb2c5)

#### Supported File Types

-**Documents**: .pdf, .doc, .docx, .txt, .md, .rtf

-**Spreadsheets**: .xls, .xlsx, .csv

-**Presentations**: .ppt, .pptx

-**Images**: .jpg, .jpeg, .png, .gif, .svg, .webp, .bmp

-**Videos:** supported video format

-**Audio:** supported audio format

-**Archives**: .zip, .rar, .7z, .tar, .gz

-**Code**: .js, .ts, .py, .java, .cpp, .c, .html, .css, .json, .xml

#### File Size Limits (use .env vairables for these)

- Regular files: Max 1000MB
- Images: Max 200MB
- Total user storage: 5GB
- Chunk size for large files: 5MB

#### Chunk Upload (for files > 50MB)

-**Upload Chunk**: `POST /api/files/upload/chunk`

- Headers: `Content-Type: multipart/form-data`
- Body: `chunk` (File), `fileId` (string), `chunkIndex` (number), `totalChunks` (number)
- Response: `{ chunkIndex, received }`

-**Merge Chunks**: `POST /api/files/upload/merge`

- Body: `{ fileId, totalChunks, type, parentId }`
- Response: `{ fileId, name, size, storagePath }`

### 1.2 FileView Page

#### File List Display

-**API Endpoint**: `GET /api/files/list`

- Query params:

  -`type`: "private/public/share" (required)

  -`page`: number (default: 1)

  -`pageSize`: number (default: 20)

  -`sortBy`: "name/size/createdAt" (default: "createdAt")

  -`sortOrder`: "asc/desc" (default: "desc")

  -`parentId`: string (optional, for folder contents)
- Response:

  ```json

  {

    "files": [

      {

        "id": "uuid",

        "fileId": "File_uuid",

        "name": "document.pdf",

        "type": "private",

        "size": 1024000,

        "mimeType": "application/pdf",

        "path": "/documents",

        "parentId": "Folder_uuid",

        "createdAt": "2024-01-01T00:00:00Z",

        "updatedAt": "2024-01-01T00:00:00Z",

        "isDeleted": false,

        "downloadable": true,

        "previewable": true

      }

    ],

    "folders": [

      {

        "id": "uuid",

        "folderId": "Folder_uuid",

        "name": "Documents",

        "type": "private",

        "path": "/documents",

        "parentId": null,

        "createdAt": "2024-01-01T00:00:00Z",

        "updatedAt": "2024-01-01T00:00:00Z",

        "isDeleted": false

      }

    ],

    "pagination": {

      "page": 1,

      "pageSize": 20,

      "total": 100,

      "totalPages": 5

    }

  }

  ```

#### View Modes

- List View: Table layout with detailed information
- Grid View: Thumbnail grid layout (for images and documents)

#### Drag & Drop Implementation

- HTML5 Drag and Drop API
- Events: dragstart, dragover, drop, dragenter, dragleave
- Visual feedback during drag (highlight drop zones)
- Progress bar for upload status
- File type validation on drop
- File size validation on drop

#### Regular Upload

- File input with multiple selection support
- Accept attribute for file type filtering
- File type validation (MIME type check)
- File size validation
- Upload progress tracking (XMLHttpRequest upload progress)

#### Upload Progress Tracking

- WebSocket endpoint: `ws://server/api/files/upload/progress/{fileId}`
- Real-time progress updates
- Progress percentage display
- Upload speed calculation
- Estimated time remaining
- Error handling and retry mechanism

### 1.3 File Management

#### Create Folders

-**API Endpoint**: `POST /api/files/folder`

- Body:

  ```json

  {

    "name": "My Documents",

    "type": "private",

    "parentId": "Folder_uuid_or_null"

  }

  ```
- Response:

  ```json

  {

    "id": "uuid",

    "folderId": "Folder_uuid",

    "name": "My Documents",

    "type": "private",

    "path": "/my-documents",

    "parentId": null,

    "createdAt": "2024-01-01T00:00:00Z",

    "updatedAt": "2024-01-01T00:00:00Z",

    "isDeleted": false

  }

  ```

#### Folder Structure

- Nested folders supported (max depth: 5)
- Virtual folders (no physical directory creation)
- Path tracking for breadcrumb navigation
- Parent-child relationship via parentId

#### Create Files

-**API Endpoint**: `POST /api/files/create`

- Supported file creation:

  - Text file: `POST /api/files/create/text`
  - Markdown file: `POST /api/files/create/markdown`
  - Code file: `POST /api/files/create/code`
- Body:

  ```json

  {

    "name": "new-file.md",

    "type": "private",

    "parentId": "Folder_uuid_or_null",

    "content": "# New File Initial content"

  }

  ```
- Response:

  ```json

  {

    "id": "uuid",

    "fileId": "File_uuid",

    "name": "new-file.md",

    "type": "private",

    "size": 20,

    "mimeType": "text/markdown",

    "path": "/new-file.md",

    "parentId": null,

    "createdAt": "2024-01-01T00:00:00Z",

    "updatedAt": "2024-01-01T00:00:00Z",

    "isDeleted": false,

    "downloadable": true,

    "previewable": true

  }

  ```

#### Move Files/Folders

-**API Endpoint**: `PUT /api/files/move`

- Body:

  ```json

  {

    "itemIds": ["File_uuid1", "Folder_uuid2"],

    "targetFolderId": "Folder_uuid_or_null"

  }

  ```
- Response:

  ```json

  {

    "moved": 2,

    "failed": 0,

    "errors": []

  }

  ```
- Move validation:

  - Check target folder exists
  - Check target folder is not a descendant of source
  - Check user has permission to move
  - Check folder depth limit (max 5 levels)

#### Delete Files (Soft Delete)

-**API Endpoint**: `DELETE /api/files`

- Body:

  ```json

  {

    "fileIds": ["File_uuid1", "File_uuid2"]

  }

  ```
- Response:

  ```json

  {

    "deleted": 2,

    "failed": 0,

    "errors": []

  }

  ```
- Soft Delete Process:

  1. Rename file to original name in database
  2. Mark file as deleted in database (isDeleted: true, deletedAt: timestamp)
  3. Move file to `/backend/upload/file/deleted/`
  4. Keep original file ID in database for recovery
- Deleted file storage path: `backend/upload/file/deleted/File_[uuid]`

#### Restore Deleted Files

-**API Endpoint**: `POST /api/files/restore`

- Body:

  ```json

  {

    "fileIds": ["File_uuid1", "File_uuid2"]

  }

  ```
- Response:

  ```json

  {

    "restored": 2,

    "failed": 0,

    "errors": []

  }

  ```
- Restore Process:

  1. Move file from deleted folder back to original location
  2. Update database (isDeleted: false, deletedAt: null)

#### Permanent Delete

-**API Endpoint**: `DELETE /api/files/permanent`

- Body:

  ```json

  {

    "fileIds": ["File_uuid1", "File_uuid2"]

  }

  ```
- Response:

  ```json

  {

    "permanentlyDeleted": 2,

    "failed": 0,

    "errors": []

  }

  ```
- Automatic permanent delete: Files in deleted folder for > 30 days

### 1.4 FileDetail Page

#### File Preview

-**Preview API Endpoint**: `GET /api/files/{fileId}/preview`

- Query params: `page` (for PDF), `thumbnail` (boolean)
- Response: File content or thumbnail image

#### Preview Technologies

-**PDF**: PDF.js (Mozilla)

- Version: 3.x
- Features: Page navigation, zoom, text selection, print
- Max pages: 100
- Max file size: 50MB

-**DOCX**: mammoth.js

- Version: 1.6.x
- Features: Text extraction, basic formatting
- Max file size: 20MB

-**XLSX**: SheetJS (xlsx.js)

- Version: 0.19.x
- Features: Spreadsheet rendering, basic formulas
- Max rows: 1000
- Max file size: 20MB

-**PPTX**: PptxGenJS

- Version: 3.12.x
- Features: Slide navigation, basic animations
- Max slides: 50
- Max file size: 30MB

-**TXT/MD**: CodeMirror or Monaco Editor

- Version: CodeMirror 6.x / Monaco 0.44.x
- Features: Syntax highlighting, line numbers, search
- Max file size: 10MB

-**ZIP**: JSZip

- Version: 3.10.x
- Features: File list, extract individual files
- Max file size: 100MB
- Max entries: 1000

-**Images**: Native browser support

- Formats: JPG, PNG, GIF, SVG, WebP, BMP
- Max file size: 20MB
- Features: Zoom, rotate, download

#### Preview Cache

- Server-side caching: Redis

  - TTL: 1 hour for documents
  - TTL: 24 hours for images
  - Key format: `preview:{fileId}:{type}`
- Client-side caching: LocalStorage

  - TTL: 30 minutes
  - Key format: `preview_{fileId}`

#### Thumbnail Generation

-**API Endpoint**: `POST /api/files/{fileId}/thumbnail`

- Async processing via message queue
- Thumbnail sizes: 150x150, 300x300, 600x600
- Storage: `backend/upload/file/thumbnails/`
- Format: WebP (for better compression)

#### Toggle File Type

-**API Endpoint**: `PUT /api/files/{fileId}/type`

- Body:

  ```json

  {

    "type": "private/public/share"

  }

  ```
- Response:

  ```json

  {

    "id": "uuid",

    "fileId": "File_uuid",

    "name": "document.pdf",

    "type": "public",

    "updatedAt": "2024-01-01T00:00:00Z"

  }

  ```
- Type change triggers:

  - Move file to appropriate folder
  - Update database
  - Clear cache

## 2. Public File Service

### 2.1 Authentication System

#### Login Flow

1.**Username Input**: User enters username

- API: `POST /api/public/auth/request`
- Body: `{ "username": "user123" }`
- Response: `{ "requestId": "uuid", "expiresIn": 300 }`

2.**Verification Code**: System sends code to private user

- Notification system integration
- Code format: 6-digit numeric
- Valid for: 5 minutes
- Max attempts: 3

3.**Code Verification**: User enters verification code

- API: `POST /api/public/auth/verify`
- Body: `{ "requestId": "uuid", "code": "123456" }`
- Response: `{ "token": "session_token", "expiresIn": 3600 }`

4.**Session Management**: Session token stored

- Cookie: HttpOnly, Secure, SameSite=Strict
- LocalStorage: For API requests
- Session duration: 1 hour (configurable)

#### Session Validation

-**API Endpoint**: `GET /api/public/auth/validate`

- Headers: `Authorization: Bearer {token}`
- Response:

  ```json

  {

    "valid": true,

    "userId": "uuid",

    "expiresAt": "2024-01-01T01:00:00Z"

  }

  ```

#### Tab/Page Close Detection

-**WebSocket Connection**: `ws://server/api/public/session/ping`

- Ping interval: 30 seconds
- Timeout: 60 seconds
- On timeout: Delete session token

-**Visibility API**: Detect tab visibility changes

- Event: `visibilitychange`
- Action: Send ping when tab becomes visible

-**BeforeUnload Event**: Detect page close

- Event: `beforeunload`
- Action: Send logout request

### 2.2 Public File Access

#### File List Display

-**API Endpoint**: `GET /api/public/files/list`

- Query params:

  -`userId`: string (required)

  -`page`: number (default: 1)

  -`pageSize`: number (default: 20)

  -`sortBy`: "name/size/createdAt" (default: "createdAt")

  -`sortOrder`: "asc/desc" (default: "desc")
- Response:

  ```json

  {

    "files": [

      {

        "id": "uuid",

        "fileId": "File_uuid",

        "name": "document.pdf",

        "type": "public",

        "size": 1024000,

        "mimeType": "application/pdf",

        "downloadable": true,

        "previewable": true,

        "createdAt": "2024-01-01T00:00:00Z"

      }

    ],

    "pagination": {

      "page": 1,

      "pageSize": 20,

      "total": 100,

      "totalPages": 5

    }

  }

  ```

#### File Download

-**API Endpoint**: `GET /api/public/files/{fileId}/download`

- Headers: `Authorization: Bearer {token}`
- Query params: `preview` (boolean, optional)
- Response: File stream or preview URL

#### Access Restrictions

- Only files with type="public" are accessible
- Only files with downloadable=true can be downloaded
- File path: `/backend/upload/file/public/File_[uuid]`

#### Access Control

-**Rate Limiting**: Max 100 requests per minute per IP

-**Session Validation**: Check token validity on each request

-**Access Logging**: Log all file access attempts

-**IP Blocking**: Block IPs with repeated failed attempts

## 3. Shared File Service

### 3.1 File Access

#### File List Display

-**API Endpoint**: `GET /api/share/files/list`

- Query params:

  -`shareId`: string (required)

  -`page`: number (default: 1)

  -`pageSize`: number (default: 20)

  -`sortBy`: "name/size/createdAt" (default: "createdAt")

  -`sortOrder`: "asc/desc" (default: "desc")
- Response:

  ```json

  {

    "files": [

      {

        "id": "uuid",

        "fileId": "File_uuid",

        "name": "document.pdf",

        "type": "share",

        "size": 1024000,

        "mimeType": "application/pdf",

        "downloadable": true,

        "previewable": true,

        "createdAt": "2024-01-01T00:00:00Z"

      }

    ],

    "folders": [

      {

        "id": "uuid",

        "folderId": "Folder_uuid",

        "name": "Shared Documents",

        "type": "share",

        "path": "/shared-documents",

        "parentId": null,

        "createdAt": "2024-01-01T00:00:00Z"

      }

    ],

    "pagination": {

      "page": 1,

      "pageSize": 20,

      "total": 50,

      "totalPages": 3

    }

  }

  ```

#### File Download

-**API Endpoint**: `GET /api/share/files/{fileId}/download`

- Query params: `shareId` (required), `preview` (boolean, optional)
- Response: File stream or preview URL

#### File Preview

-**API Endpoint**: `GET /api/share/files/{fileId}/preview`

- Query params: `shareId` (required), `page` (for PDF), `thumbnail` (boolean)
- Response: File content or thumbnail image

### 3.2 Access Control

#### Share Link Management

-**Create Share Link**: `POST /api/share/create`

- Body:

  ```json

  {

    "fileIds": ["File_uuid1", "File_uuid2"],

    "folderIds": ["Folder_uuid1"],

    "expiresIn": 86400,

    "maxAccess": 100,

    "requirePassword": false

  }

  ```
- Response:

  ```json

  {

    "shareId": "uuid",

    "shareUrl": "https://server/share/uuid",

    "expiresAt": "2024-01-02T00:00:00Z",

    "createdAt": "2024-01-01T00:00:00Z"

  }

  ```

-**Update Share Link**: `PUT /api/share/{shareId}`

- Body:

  ```json

  {

    "expiresIn": 172800,

    "maxAccess": 200,

    "requirePassword": true

  }

  ```
- Response:

  ```json

  {

    "shareId": "uuid",

    "expiresAt": "2024-01-03T00:00:00Z",

    "updatedAt": "2024-01-01T12:00:00Z"

  }

  ```

-**Revoke Share Link**: `DELETE /api/share/{shareId}`

- Response:

  ```json

  {

    "revoked": true,

    "revokedAt": "2024-01-01T12:00:00Z"

  }

  ```

#### Share Statistics

-**API Endpoint**: `GET /api/share/{shareId}/stats`

- Response:

  ```json

  {

    "shareId": "uuid",

    "totalAccess": 50,

    "uniqueVisitors": 30,

    "downloads": 20,

    "lastAccessedAt": "2024-01-01T12:00:00Z",

    "accessHistory": [

      {

        "timestamp": "2024-01-01T12:00:00Z",

        "action": "download",

        "fileId": "File_uuid",

        "fileName": "document.pdf"

      }

    ]

  }

  ```

#### Access Restrictions

- Only files/folders with type="share" are accessible
- Share links expire after specified time
- Max access count limit
- Optional password protection
- IP-based access logging

## 4. File System

### 4.1 Storage Structure

#### Directory Layout

```

backend/upload/file/

├── private_[userId]/

│   ├── File_[uuid]

│   └── Folder_[uuid]/

├── public/

│   ├── File_[uuid]

│   └── Folder_[uuid]/

├── share/

│   ├── File_[uuid]

│   └── Folder_[uuid]/

├── deleted/

│   └── File_[uuid]

└── thumbnails/

    └── [fileId]_[size].webp

```

#### File Naming Rules

- Files: `File_[uuid]`
- Folders: `Folder_[uuid]`
- Thumbnails: `[fileId]_[size].webp` (e.g., `File_uuid_150.webp`)
- Deleted files: Keep original File_[uuid] naming

#### UUID Generation

- Version: UUID v4
- Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
- Example: 550e8400-e29b-41d4-a716-446655440000
- Collision probability: Negligible (1 in 2^122)

### 4.2 File Operations

#### Upload Process

1. Receive file in temporary location
2. Generate UUID for file
3. Calculate file hash (SHA256)
4. Check for duplicates by hash
5. Move file to target directory
6. Create database record
7. Generate thumbnails (async)
8. Update backup JSON

#### Delete Process

1. Mark file as deleted in database
2. Move file to deleted folder
3. Update backup JSON
4. Schedule permanent delete (30 days)

#### Restore Process

1. Check file exists in deleted folder
2. Move file back to original location
3. Update database (isDeleted: false)
4. Update backup JSON

### 4.3 File Metadata

#### File Hash Calculation

- Algorithm: SHA256
- Purpose: Duplicate detection, integrity verification
- Storage: In database (file db index)
- Calculation: During upload, after file is fully received

#### File Size Tracking

- Unit: Bytes
- Storage: In database
- Update: On upload, restore
- Validation: Check against size limits

#### MIME Type Detection

- Method: File magic bytes + extension
- Fallback: application/octet-stream
- Storage: In database
- Validation: Check against allowed types

## 5. Database Design

### 5.1 File Table

#### Schema

```sql

CREATETABLEfiles (

    id UUID PRIMARY KEYDEFAULT uuid_generate_v4(),

    user_id UUID NOT NULLREFERENCES users(id),

    file_id UUID NOT NULLUNIQUE,

    nameVARCHAR(255) NOT NULL,

    pathVARCHAR(1024) DEFAULT'/',

    typeVARCHAR(20) NOT NULLCHECK (typeIN ('private', 'public', 'share')),

    mime_type VARCHAR(100),

    sizeBIGINTNOT NULL,

    hashVARCHAR(64),

    storage_path VARCHAR(1024) NOT NULL,

    downloadable BOOLEANDEFAULT true,

    previewable BOOLEANDEFAULT true,

    parent_id UUID REFERENCES folders(id),

    created_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    is_deleted BOOLEANDEFAULT false,

    download_count INTEGERDEFAULT0,

    last_accessed_at TIMESTAMP,

    thumbnail_path VARCHAR(1024),

    versionINTEGERDEFAULT1

);


-- Indexes

CREATEINDEXidx_files_user_idON files(user_id);

CREATEINDEXidx_files_typeON files(type);

CREATEINDEXidx_files_is_deletedON files(is_deleted);

CREATEINDEXidx_files_parent_idON files(parent_id);

CREATEINDEXidx_files_hashON files(hash);

CREATEINDEXidx_files_user_type_deletedON files(user_id, type, is_deleted);

```

### 5.2 Folder Table

#### Schema

```sql

CREATETABLEfolders (

    id UUID PRIMARY KEYDEFAULT uuid_generate_v4(),

    user_id UUID NOT NULLREFERENCES users(id),

    folder_id UUID NOT NULLUNIQUE,

    nameVARCHAR(255) NOT NULL,

    pathVARCHAR(1024) DEFAULT'/',

    typeVARCHAR(20) NOT NULLCHECK (typeIN ('private', 'public', 'share')),

    parent_id UUID REFERENCES folders(id),

    created_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEANDEFAULT false,

    descriptionTEXT

);


-- Indexes

CREATEINDEXidx_folders_user_idON folders(user_id);

CREATEINDEXidx_folders_typeON folders(type);

CREATEINDEXidx_folders_parent_idON folders(parent_id);

CREATEINDEXidx_folders_is_deletedON folders(is_deleted);

CREATEINDEXidx_folders_user_type_deletedON folders(user_id, type, is_deleted);

```

### 5.3 Share Links Table

#### Schema

```sql

CREATETABLEshare_links (

    id UUID PRIMARY KEYDEFAULT uuid_generate_v4(),

    share_id UUID NOT NULLUNIQUE,

    user_id UUID NOT NULLREFERENCES users(id),

    expires_at TIMESTAMPNOT NULL,

    max_access INTEGER,

    require_password BOOLEANDEFAULT false,

    password_hash VARCHAR(255),

    created_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP,

    is_revoked BOOLEANDEFAULT false,

    revoked_at TIMESTAMP

);


-- Indexes

CREATEINDEXidx_share_links_share_idON share_links(share_id);

CREATEINDEXidx_share_links_user_idON share_links(user_id);

CREATEINDEXidx_share_links_is_revokedON share_links(is_revoked);

```

### 5.4 Share Items Table

#### Schema

```sql

CREATETABLEshare_items (

    id UUID PRIMARY KEYDEFAULT uuid_generate_v4(),

    share_id UUID NOT NULLREFERENCES share_links(share_id),

    file_id UUID REFERENCES files(id),

    folder_id UUID REFERENCES folders(id),

    created_at TIMESTAMPDEFAULT CURRENT_TIMESTAMP

);


-- Indexes

CREATEINDEXidx_share_items_share_idON share_items(share_id);

CREATEINDEXidx_share_items_file_idON share_items(file_id);

CREATEINDEXidx_share_items_folder_idON share_items(folder_id);

```

## 6. Backup System

### 6.1 Backup Structure

#### Backup File Location

- Path: `/backend/upload/file/backup/`
- Format: JSON
- Naming: `backup_[timestamp].json`
- Rotation: Keep last 7 days

#### Backup Content

```json

{

  "version": "1.0",

  "timestamp": "2024-01-01T00:00:00Z",

  "files": [

    {

      "fileId": "File_uuid",

      "originalName": "document.pdf",

      "userId": "uuid",

      "type": "private",

      "storagePath": "private_[userId]/File_uuid",

      "createdAt": "2024-01-01T00:00:00Z"

    }

  ],

  "folders": [

    {

      "folderId": "Folder_uuid",

      "name": "Documents",

      "userId": "uuid",

      "type": "private",

      "parentId": null,

      "createdAt": "2024-01-01T00:00:00Z"

    }

  ]

}

```

### 6.2 Backup Operations

#### Create Backup

-**API Endpoint**: `POST /api/backup/create`

- Response:

  ```json

  {

    "backupId": "uuid",

    "timestamp": "2024-01-01T00:00:00Z",

    "fileCount": 100,

    "folderCount": 20

  }

  ```
- Process:

  1. Query all files and folders from database
  2. Generate JSON structure
  3. Write to backup file
  4. Verify backup integrity

#### Restore Backup

-**API Endpoint**: `POST /api/backup/restore`

- Body:

  ```json

  {

    "backupId": "uuid",

    "restoreFiles": true,

    "restoreFolders": true

  }

  ```
- Response:

  ```json

  {

    "restoredFiles": 100,

    "restoredFolders": 20,

    "failedFiles": 0,

    "failedFolders": 0

  }

  ```
- Process:

  1. Read backup file
  2. Verify backup integrity
  3. Restore database records
  4. Verify file existence
  5. Generate report

#### Backup Schedule

- Full backup: Daily at 2:00 AM
- Incremental backup: Every 6 hours
- Retention policy: 7 days for full backups, 24 hours for incremental backups

### 6.3 Backup Verification

#### Integrity Check

-**API Endpoint**: `GET /api/backup/verify/{backupId}`

- Response:

  ```json

  {

    "backupId": "uuid",

    "valid": true,

    "fileCount": 100,

    "folderCount": 20,

    "verifiedAt": "2024-01-01T00:00:00Z"

  }

  ```
- Process:

  1. Read backup file
  2. Validate JSON structure
  3. Check file existence
  4. Verify database records
  5. Generate report

## 7. Security

### 7.1 Authentication

#### JWT Token Structure

```json

{

  "header": {

    "alg": "HS256",

    "typ": "JWT"

  },

  "payload": {

    "userId": "uuid",

    "username": "user123",

    "role": "user",

    "iat": 1704067200,

    "exp": 1704070800

  }

}

```

#### Token Management

- Access token expiration: 1 hour
- Refresh token expiration: 7 days
- Token storage: HttpOnly, Secure, SameSite=Strict cookie
- Token refresh: Automatic when expired

### 7.2 Authorization

#### Permission Levels

-**Read**: View files and folders

-**Write**: Upload and modify files

-**Delete**: Delete files and folders

-**Share**: Create and manage share links

#### Permission Matrix

| Action   | Private | Public | Share      |

| -------- | ------- | ------ | ---------- |

| View     | Owner   | All    | Authorized |

| Download | Owner   | All    | Authorized |

| Upload   | Owner   | None   | None       |

| Delete   | Owner   | None   | None       |

| Share    | Owner   | None   | None       |

### 7.3 File Security

#### Upload Security

- File type validation (MIME type + magic bytes)
- File size limits
- Virus scanning (ClamAV)
- File name sanitization
- Path traversal prevention

#### Download Security

- Rate limiting (100 requests/minute)
- Session validation
- Permission checks
- Access logging

#### Storage Security

- File encryption (AES-256) for sensitive files
- Secure file permissions (600 for files, 700 for directories)
- Regular security audits
- Backup encryption

### 7.4 Access Control

#### IP-based Restrictions

- Whitelist: Allow specific IPs
- Blacklist: Block specific IPs
- Rate limiting per IP
- Geo-blocking (optional)

#### Session Security

- Session timeout: 1 hour
- Session validation on each request
- Session invalidation on logout
- Concurrent session limit: 3 per user

## 8. Performance Optimization

### 8.1 Caching Strategy

#### Redis Caching

-**File Metadata Cache**

- Key: `file:{fileId}`
- TTL: 1 hour
- Content: File metadata from database

-**Folder Structure Cache**

- Key: `folder:{folderId}:structure`
- TTL: 30 minutes
- Content: Folder hierarchy

-**Preview Cache**

- Key: `preview:{fileId}:{type}`
- TTL: 1 hour for documents, 24 hours for images
- Content: Generated preview data

-**Thumbnail Cache**

- Key: `thumbnail:{fileId}:{size}`
- TTL: 7 days
- Content: Thumbnail image data

-**Session Cache**

- Key: `session:{sessionId}`
- TTL: 1 hour
- Content: Session data

#### CDN Integration

- Static assets: CSS, JS, images
- File downloads: Cached for 24 hours
- Preview content: Cached for 1 hour
- Invalidation: Manual or time-based

### 8.2 Database Optimization

#### Connection Pooling

- Max connections: 100
- Min connections: 10
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

#### Query Optimization

- Use indexes for frequently queried fields
- Avoid N+1 queries with proper joins
- Use prepared statements for repeated queries
- Implement query result caching

#### Database Partitioning

- Partition files table by type (private/public/share)
- Partition by date for large tables
- Implement table partitioning for logs

### 8.3 File Upload Optimization

#### Chunk Upload

- Chunk size: 5MB
- Parallel uploads: 3 chunks at a time
- Resume capability: Track uploaded chunks
- Progress tracking: Real-time via WebSocket

#### Compression

- Client-side compression: Gzip for text files
- Server-side compression: Automatic for supported types
- Compression levels: Balanced between speed and size

#### Deduplication

- Hash-based duplicate detection
- Link duplicate files to single storage
- Save space for repeated uploads

### 8.4 Asynchronous Processing

#### Message Queue

- Queue: RabbitMQ/Bull
- Tasks:

  - Thumbnail generation
  - File conversion
  - Virus scanning
  - Backup creation
  - Email notifications

#### Worker Processes

- Number of workers: CPU cores * 2
- Task priority: High for user-facing operations
- Retry mechanism: 3 attempts with exponential backoff
- Dead letter queue: For failed tasks

## 9. Monitoring and Logging

### 9.1 Health Checks

#### Health Check Endpoint

-**API Endpoint**: `GET /api/health`

- Response:

  ```json

  {

    "status": "healthy",

    "timestamp": "2024-01-01T00:00:00Z",

    "services": {

      "database": "healthy",

      "redis": "healthy",

      "storage": "healthy",

      "messageQueue": "healthy"

    }

  }

  ```

#### Service Dependencies

- Database connection check
- Redis connection check
- Storage availability check
- Message queue connection check

### 9.2 Performance Monitoring

#### Metrics Collection

- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate
- Active connections
- Queue length

#### Monitoring Tools

- Prometheus: Metrics collection
- Grafana: Visualization
- AlertManager: Alert management

#### Key Performance Indicators

- API response time: < 200ms (p95)
- File upload speed: > 10MB/s
- Database query time: < 50ms (p95)
- Cache hit rate: > 80%

### 9.3 Logging

#### Log Levels

- ERROR: Critical errors requiring immediate attention
- WARN: Warning messages for potential issues
- INFO: General informational messages
- DEBUG: Detailed debugging information

#### Log Format

```json

{

  "timestamp": "2024-01-01T00:00:00Z",

  "level": "INFO",

  "service": "file-service",

  "userId": "uuid",

  "action": "upload",

  "fileId": "File_uuid",

  "status": "success",

  "duration": 1234

}

```

#### Log Storage

- Local storage: 7 days
- Centralized logging: ELK Stack
- Log rotation: Daily
- Compression: Gzip

### 9.4 Error Tracking

#### Error Monitoring

- Tool: Sentry
- Automatic error capture
- Stack trace collection
- User context tracking

#### Alerting

- Critical errors: Immediate notification
- Warning level: Hourly digest
- Performance degradation: Threshold-based alerts
- Resource exhaustion: Immediate notification

## 10. API Documentation

### 10.1 Authentication

#### Login

-**Endpoint**: `POST /api/auth/login`

-**Request Body**:

```json

  {

    "username": "string",

    "password": "string"

  }

```

-**Response**:

```json

  {

    "token": "string",

    "refreshToken": "string",

    "expiresIn": 3600

  }

```

#### Refresh Token

-**Endpoint**: `POST /api/auth/refresh`

-**Request Body**:

```json

  {

    "refreshToken": "string"

  }

```

-**Response**:

```json

  {

    "token": "string",

    "expiresIn": 3600

  }

```

#### Logout

-**Endpoint**: `POST /api/auth/logout`

-**Headers**: `Authorization: Bearer {token}`

-**Response**:

```json

  {

    "success": true

  }

```

### 10.2 File Operations

#### Upload File

-**Endpoint**: `POST /api/files/upload`

-**Headers**: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`

-**Request Body**:

  -`file`: File

  -`type`: string (private/public/share)

  -`parentId`: string (optional)

-**Response**:

```json

  {

    "id": "uuid",

    "fileId": "File_uuid",

    "name": "string",

    "size": number,

    "mimeType": "string",

    "storagePath": "string"

  }

```

#### Download File

-**Endpoint**: `GET /api/files/{fileId}/download`

-**Headers**: `Authorization: Bearer {token}`

-**Response**: File stream

#### Delete File

-**Endpoint**: `DELETE /api/files/{fileId}`

-**Headers**: `Authorization: Bearer {token}`

-**Response**:

```json

  {

    "deleted": true

  }

```

### 10.3 Folder Operations

#### Create Folder

-**Endpoint**: `POST /api/folders`

-**Headers**: `Authorization: Bearer {token}`

-**Request Body**:

```json

  {

    "name": "string",

    "type": "string",

    "parentId": "string"

  }

```

-**Response**:

```json

  {

    "id": "uuid",

    "folderId": "Folder_uuid",

    "name": "string",

    "type": "string",

    "path": "string",

    "parentId": "string"

  }

```

#### List Folder Contents

-**Endpoint**: `GET /api/folders/{folderId}/contents`

-**Headers**: `Authorization: Bearer {token}`

-**Query Parameters**:

  -`page`: number (default: 1)

  -`pageSize`: number (default: 20)

-**Response**:

```json

  {

    "files": [...],

    "folders": [...],

    "pagination": {

      "page": 1,

      "pageSize": 20,

      "total": 100,

      "totalPages": 5

    }

  }

```

### 10.4 Share Operations

#### Create Share Link

-**Endpoint**: `POST /api/share/create`

-**Headers**: `Authorization: Bearer {token}`

-**Request Body**:

```json

  {

    "fileIds": ["string"],

    "folderIds": ["string"],

    "expiresIn": number,

    "maxAccess": number,

    "requirePassword": boolean

  }

```

-**Response**:

```json

  {

    "shareId": "uuid",

    "shareUrl": "string",

    "expiresAt": "string"

  }

```

#### Access Shared Files

-**Endpoint**: `GET /api/share/{shareId}/files`

-**Query Parameters**:

  -`page`: number (default: 1)

  -`pageSize`: number (default: 20)

-**Response**:

```json

  {

    "files": [...],

    "folders": [...],

    "pagination": {

      "page": 1,

      "pageSize": 20,

      "total": 50,

      "totalPages": 3

    }

  }

```

## 11. Deployment

### 11.1 Environment Configuration

#### Environment Variables (please only append to the current file)

```bash

# Application

NODE_ENV=production

PORT=3000

API_BASE_URL=https://api.example.com


# Database

DB_HOST=localhost

DB_PORT=5432

DB_NAME=file_storage

DB_USER=postgres

DB_PASSWORD=your_password


# Redis

REDIS_HOST=localhost

REDIS_PORT=6379

REDIS_PASSWORD=


# JWT

JWT_SECRET=your_secret_key

JWT_EXPIRES_IN=1h

JWT_REFRESH_EXPIRES_IN=7d


# Storage

UPLOAD_DIR=/var/www/uploads

MAX_FILE_SIZE=104857600

MAX_TOTAL_STORAGE=5368709120


# CDN

CDN_URL=https://cdn.example.com

CDN_ACCESS_KEY=your_access_key

CDN_SECRET_KEY=your_secret_key


# Message Queue

RABBITMQ_URL=amqp://localhost:5672

RABBITMQ_QUEUE=file_tasks


# Monitoring

SENTRY_DSN=https://your_sentry_dsn

PROMETHEUS_PORT=9090

```

### 11.2 Docker Configuration

#### Dockerfile

```dockerfile

FROM node:18-alpine


WORKDIR /app


COPY package*.json ./

RUN npm ci --only=production


COPY . .

RUN npm run build


EXPOSE 3000


CMD ["npm", "start"]

```

#### docker-compose.yml

```yaml

version: '3.8'


services:

  app:

    build: .

    ports:

      - "3000:3000"

    environment:

      - NODE_ENV=production

    depends_on:

      - db

      - redis

      - rabbitmq

    volumes:

      - ./uploads:/app/uploads


  db:

    image: postgres:15

    environment:

      POSTGRES_DB: file_storage

      POSTGRES_USER: postgres

      POSTGRES_PASSWORD: password

    volumes:

      - postgres_data:/var/lib/postgresql/data


  redis:

    image: redis:7-alpine

    volumes:

      - redis_data:/data


  rabbitmq:

    image: rabbitmq:3-management

    ports:

      - "5672:5672"

      - "15672:15672"

    volumes:

      - rabbitmq_data:/var/lib/rabbitmq


volumes:

  postgres_data:

  redis_data:

  rabbitmq_data:

```

### 11.3 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml

name: CI/CD


on:

  push:

    branches: [ main ]

  pull_request:

    branches: [ main ]


jobs:

  test:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3

        with:

          node-version: 18

      - run: npm ci

      - run: npm test


  build:

    needs: test

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3

        with:

          node-version: 18

      - run: npm ci

      - run: npm run build

      - uses: actions/upload-artifact@v3

        with:

          name: dist

          path: dist


  deploy:

    needs: build

    runs-on: ubuntu-latest

    if: github.ref == 'refs/heads/main'

    steps:

      - uses: actions/checkout@v3

      - name: Deploy to server

        run: |

          ssh user@server 'cd /app && git pull && docker-compose up -d --build'

```

### 11.4 Scaling Strategy

#### Horizontal Scaling

- Load balancer: Nginx
- Multiple application instances
- Shared storage: NAS or cloud storage
- Session storage: Redis

#### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Increase cache size

## 12. Frontend Implementation

### 12.1 Technology Stack

#### Core Framework

-**Vue.js 3**: Progressive JavaScript framework

-**Vite**: Build tool and dev server

-**TypeScript**: Type-safe JavaScript

#### UI Framework

-**Element Plus**: Vue 3 component library

- Version: 2.x
- Features: Rich components, theme customization

-**Tailwind CSS**: Utility-first CSS framework

- Version: 3.x
- Features: Responsive design, utility classes

#### State Management

-**Pinia**: Vue 3 state management

- Stores: files, folders, user, settings
- Persistence: LocalStorage for user preferences

#### Routing

-**Vue Router**: Official Vue router

- Version: 4.x
- Features: Lazy loading, route guards

### 12.2 Component Structure

#### FileView Component

```vue

<template>

  <divclass="file-view">

    <file-toolbar/>

    <file-list :files="files" :folders="folders"/>

    <file-uploader @upload="handleUpload"/>

  </div>

</template>


<scriptsetuplang="ts">

import { ref, onMounted } from'vue';

import { useFileStore } from'@/stores/file';


constfileStore=useFileStore();

constfiles=ref([]);

constfolders=ref([]);


onMounted(async () => {

  awaitfileStore.fetchFiles();

  files.value=fileStore.files;

  folders.value=fileStore.folders;

});


consthandleUpload=async (file:File) => {

  awaitfileStore.uploadFile(file);

};

</script>

```

#### FileDetail Component

```vue

<template>

  <divclass="file-detail">

    <file-header :file="file"/>

    <file-preview :file="file"/>

    <file-actions :file="file"/>

  </div>

</template>


<scriptsetuplang="ts">

import { ref, onMounted } from'vue';

import { useRoute } from'vue-router';

import { useFileStore } from'@/stores/file';


constroute=useRoute();

constfileStore=useFileStore();

constfile=ref(null);


onMounted(async () => {

  constfileId=route.params.id;

  file.value=awaitfileStore.fetchFile(fileId);

});

</script>

```

### 12.3 State Management

#### File Store (Pinia)

```typescript

import { defineStore } from'pinia';

import { ref, computed } from'vue';


exportconstuseFileStore = defineStore('file', () => {

  constfiles = ref([]);

  constfolders = ref([]);

  constcurrentFolder = ref(null);


  constactiveFiles = computed(() =>

    files.value.filter(f=> !f.isDeleted)

  );


  asyncfunctionfetchFiles(params?: any) {

    constresponse = awaitapi.get('/files/list', { params });

    files.value = response.data.files;

    folders.value = response.data.folders;

  }


  asyncfunctionuploadFile(file: File, options?: any) {

    constformData = newFormData();

    formData.append('file', file);

    if (options?.parentId) {

      formData.append('parentId', options.parentId);

    }

    constresponse = awaitapi.post('/files/upload', formData);

    returnresponse.data;

  }


  asyncfunctiondeleteFile(fileId: string) {

    awaitapi.delete(`/files/${fileId}`);

    constindex = files.value.findIndex(f=>f.id === fileId);

    if (index !== -1) {

      files.value.splice(index, 1);

    }

  }


  return {

    files,

    folders,

    currentFolder,

    activeFiles,

    fetchFiles,

    uploadFile,

    deleteFile

  };

});

```

### 12.4 API Integration

#### API Client

```typescript

importaxiosfrom'axios';


constapi = axios.create({

  baseURL:import.meta.env.VITE_API_BASE_URL,

  timeout:30000,

});


// Request interceptor

api.interceptors.request.use(

  (config) => {

    consttoken = localStorage.getItem('token');

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;

    }

    returnconfig;

  },

  (error) => {

    returnPromise.reject(error);

  }

);


// Response interceptor

api.interceptors.response.use(

  (response) =>response,

  async (error) => {

    if (error.response?.status === 401) {

      // Refresh token

      constrefreshToken = localStorage.getItem('refreshToken');

      constresponse = awaitaxios.post('/auth/refresh', { refreshToken });

      localStorage.setItem('token', response.data.token);

      // Retry original request

      error.config.headers.Authorization = `Bearer ${response.data.token}`;

      returnapi.request(error.config);

    }

    returnPromise.reject(error);

  }

);


exportdefaultapi;

```

## 13. Testing

### 13.1 Unit Testing

#### File Store Tests

```typescript

import { setActivePinia, createPinia } from'pinia';

import { useFileStore } from'@/stores/file';

import { describe, it, expect, beforeEach } from'vitest';


describe('File Store', () => {

  beforeEach(() => {

    setActivePinia(createPinia());

  });


  it('fetches files successfully', async () => {

    conststore = useFileStore();

    awaitstore.fetchFiles();

    expect(store.files).toBeDefined();

    expect(store.files.length).toBeGreaterThan(0);

  });


  it('uploads file successfully', async () => {

    conststore = useFileStore();

    constfile = newFile(['content'], 'test.txt', { type:'text/plain' });

    constresult = awaitstore.uploadFile(file);

    expect(result).toBeDefined();

    expect(result.fileId).toBeDefined();

  });

});

```

### 13.2 Integration Testing

#### API Tests

```typescript

import { describe, it, expect, beforeAll, afterAll } from'vitest';

importaxiosfrom'axios';


describe('File API', () => {

  letauthToken: string;

  lettestFileId: string;


  beforeAll(async () => {

    // Login and get auth token

    constresponse = awaitaxios.post('/api/auth/login', {

      username:'testuser',

      password:'password123'

    });

    authToken = response.data.token;

  });


  it('uploads a file', async () => {

    constformData = newFormData();

    formData.append('file', newFile(['content'], 'test.txt'));


    constresponse = awaitaxios.post('/api/files/upload', formData, {

      headers: {

        Authorization:`Bearer ${authToken}`,

        'Content-Type':'multipart/form-data'

      }

    });


    expect(response.status).toBe(200);

    testFileId = response.data.fileId;

  });


  it('downloads a file', async () => {

    constresponse = awaitaxios.get(`/api/files/${testFileId}/download`, {

      headers: {

        Authorization:`Bearer ${authToken}`

      },

      responseType:'arraybuffer'

    });


    expect(response.status).toBe(200);

    expect(response.data).toBeInstanceOf(ArrayBuffer);

  });

});

```

### 13.3 E2E Testing

#### Playwright Tests

```typescript

import { test, expect } from'@playwright/test';


test.describe('File Management', () => {

  test.beforeEach(async ({ page }) => {

    awaitpage.goto('/files');

    awaitpage.fill('[name="username"]', 'testuser');

    awaitpage.fill('[name="password"]', 'password123');

    awaitpage.click('button[type="submit"]');

  });


  test('uploads a file', async ({ page }) => {

    constfileInput = page.locator('input[type="file"]');

    awaitfileInput.setInputFiles('test.txt');

    awaitpage.click('button:has-text("Upload")');

    awaitexpect(page.locator('.file-item:has-text("test.txt")')).toBeVisible();

  });


  test('deletes a file', async ({ page }) => {

    awaitpage.click('.file-item:has-text("test.txt") .delete-button');

    awaitpage.click('button:has-text("Confirm")');

    awaitexpect(page.locator('.file-item:has-text("test.txt")')).not.toBeVisible();

  });

});

```

---

***PLEASE STOP READING HERE***

Advice:

## System Evaluation

### 优点 (Strengths)

1.**清晰的文件分类**: private/public/share三种类型的划分合理，满足了不同场景的需求

2.**软删除机制**: 通过数据库索引和物理移动实现软删除，提供了数据恢复的可能性

3.**备份策略**: 使用JSON文件跟踪所有文件/文件夹名称，作为数据库的备份机制

4.**会话管理**: 公共文件服务使用简单的会话系统，并考虑了标签页关闭的情况

5.**文件重命名**: 使用唯一ID命名文件，避免文件名冲突

### 需要改进的地方 (Areas for Improvement)

#### 1. 文件夹数据库索引设计

**建议的folder db index结构**:

```

1. id: 唯一标识符 (UUID)

2. userId: 创建该文件夹的用户ID

3. folderId: 文件夹的唯一ID (UUID)

4. name: 文件夹原始名称

5. path: 文件夹路径 (如: "/documents/work")

6. type: "private/public/share"

7. parentId: 父文件夹ID (null表示根目录)

8. createdAt: 创建时间

9. updatedAt: 最后修改时间

10. isDeleted: 是否已删除 (布尔值)

```

**优化建议**:

- 添加索引: 在userId、parentId和type字段上创建索引以提高查询性能
- 考虑添加folderLevel字段，限制文件夹嵌套深度（建议最大5层）
- 添加description字段，允许用户为文件夹添加描述信息

#### 2. 备份机制优化

**当前问题**:

- JSON文件备份策略较为简单，可能无法处理大量数据
- 缺乏增量备份机制
- 没有备份恢复的详细流程

**改进建议**:

- 实现增量备份：每天只备份变更的文件/文件夹
- 添加备份版本控制：保留最近7天的备份
- 使用更高效的备份格式：考虑使用SQLite或专门的备份工具
- 添加备份完整性检查：定期验证备份文件的有效性
- 实现自动恢复机制：提供一键恢复功能

#### 3. 安全性增强

**建议添加**:

- 文件访问权限控制：添加read/write/delete权限级别
- 文件上传病毒扫描：集成ClamAV等开源杀毒软件
- 文件下载限速：防止恶意下载导致服务器过载
- 敏感文件加密：对特定类型文件进行加密存储
- 审计日志：记录所有文件操作（上传、下载、删除等）

#### 4. 性能优化

**建议添加**:

- 文件分片上传：大文件分片上传，提高上传成功率
- CDN集成：静态文件使用CDN加速
- 文件预览缓存：预览文件缓存到Redis
- 数据库连接池：使用连接池管理数据库连接
- 异步处理：文件处理操作（如缩略图生成）使用消息队列异步处理

#### 5. 用户体验改进

**建议添加**:

- 文件版本控制：支持文件历史版本查看和恢复
- 文件分享链接：生成临时分享链接，支持过期时间设置
- 批量操作：支持批量上传、下载、移动、删除
- 拖拽排序：支持文件/文件夹拖拽排序
- 快捷键支持：常用操作支持键盘快捷键
- 离线支持：使用Service Worker实现离线文件访问

#### 6. 系统监控与维护

**建议添加**:

- 健康检查端点：提供系统健康状态API
- 性能监控：集成Prometheus/Grafana监控系统性能
- 错误追踪：使用Sentry等工具追踪系统错误
- 日志管理：结构化日志，便于问题排查
- 自动清理：定期清理过期文件和缓存

#### 7. 扩展性考虑

**建议添加**:

- 插件系统：支持第三方插件扩展功能
- API限流：防止API滥用
- 多语言支持：国际化支持
- 主题定制：支持自定义UI主题
- 移动端适配：响应式设计，支持移动设备

#### 8. 数据库设计优化

**建议的完整file db index结构**:

```

1. id: 唯一标识符 (UUID)

2. userId: 上传文件的用户ID

3. fileId: 文件唯一ID (UUID)

4. name: 文件原始名称

5. path: 文件路径 (如: "/documents/work")

6. type: "private/public/share"

7. mimeType: 文件MIME类型

8. size: 文件大小 (字节)

9. hash: 文件哈希值 (MD5/SHA256)

10. storagePath: 物理存储路径

11. downloadable: 是否可下载 (布尔值)

12. previewable: 是否可预览 (布尔值)

13. createdAt: 创建时间

14. updatedAt: 最后修改时间

15. deletedAt: 删除时间 (null表示未删除)

16. isDeleted: 是否已删除 (布尔值)

17. downloadCount: 下载次数

18. lastAccessedAt: 最后访问时间

19. thumbnailPath: 缩略图路径 (可选)

20. version: 文件版本号

```

**索引建议**:

- 在userId、type、isDeleted字段上创建复合索引
- 在fileId字段上创建唯一索引
- 在hash字段上创建索引，用于文件去重

#### 9. 文件共享服务改进

**当前问题**: "same with private, except with no delete or move file (can only download and)" - 句子不完整

**改进建议**:

- 明确共享文件服务的完整功能范围
- 添加共享权限控制：只读/可下载/可编辑
- 共享链接管理：生成、撤销、设置过期时间
- 共享访问统计：记录访问次数、访问者信息
- 共享通知：当共享文件被访问时通知文件所有者

#### 10. 公共文件服务改进

**建议添加**:

- 访问频率限制：防止恶意访问
- 访问日志：记录所有访问行为
- 访问码机制：除了用户名验证，添加访问码二次验证
- IP白名单：限制特定IP访问
- 访问时间限制：限制访问时间段

## 技术栈建议

### 后端

- Node.js + Express/Koa
- 数据库: PostgreSQL/MySQL (主数据库) + Redis (缓存)
- 文件存储: 本地存储 + 可选云存储 (AWS S3/阿里云OSS)
- 消息队列: RabbitMQ/Bull (异步任务处理)
- 杀毒软件: ClamAV

### 前端

- Vue.js 3 + Vite
- UI框架: Element Plus/Ant Design Vue
- 文件预览: PDF.js, mammoth.js, SheetJS, JSZip
- 状态管理: Pinia
- 路由: Vue Router

### DevOps

- 容器化: Docker + Docker Compose
- CI/CD: GitHub Actions/GitLab CI
- 监控: Prometheus + Grafana
- 日志: ELK Stack (Elasticsearch + Logstash + Kibana)

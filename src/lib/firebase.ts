// Import the functions you need from the SDKs you need
import { error } from "console";
import { initializeApp } from "firebase/app";
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgseeGZqd__mMnYuiKwld8xtcpi7JCxVU",
  authDomain: "code-raptor.firebaseapp.com",
  projectId: "code-raptor",
  storageBucket: "code-raptor.firebasestorage.app",
  messagingSenderId: "285012367141",
  appId: "1:285012367141:web:a0dacb5261b2cc1e2d6ccc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app)

export async function uploadFile(file: File, setProgress?: (progress: number) => void) {
return new Promise((resolve, reject) => {
    try {
        // Defensive check to make sure file exists
        if (!file) {
            reject(new Error('File is undefined'));
            return;
        }
        const storageRef = ref(storage, file.name)
        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on('state_changed', (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            if (setProgress) setProgress(progress)
            switch (snapshot.state) {
                case 'paused':
                    console.log('upload is paused'); break;
                    case 'running':
                        console.log('upload is running'); break;
        }
        }, (error) => {
            reject(error)
        }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL)
            })
        })
    } catch (error) {
        console.error(error)
        reject(error)
    }
})
}

// Function to delete a file from Firebase Storage using its URL
export async function deleteFile(fileUrl: string) {
    try {
        // Extract the file path from the URL
        // Firebase Storage URLs typically have this format:
        // https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[file_path]?[token]
        const url = new URL(fileUrl);
        const filePath = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
        
        if (!filePath) {
            console.error('Could not extract file path from URL:', fileUrl);
            return false;
        }
        
        // Create a reference to the file
        const fileRef = ref(storage, filePath);
        
        // Delete the file
        await deleteObject(fileRef);
        console.log('File successfully deleted:', filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

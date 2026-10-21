/** Sign-in / sign-up and file uploads. */
import { defineStrings } from './define';

export const auth = defineStrings(
  {
    signIn: 'Iniciar sesión',
    signUp: 'Crear cuenta',
    signOut: 'Cerrar sesión',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    or: 'o',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    upload: 'Subir imagen',
    uploading: 'Subiendo…',
    uploadFailed: 'No se pudo subir el archivo',
  },
  {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    or: 'or',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    upload: 'Upload image',
    uploading: 'Uploading…',
    uploadFailed: 'Could not upload the file',
  },
);

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin, storedHash) {
  const hash = await hashPin(pin);
  return hash === storedHash;
}

export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric(memberId, memberName) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Aureum Heritage', id: location.hostname },
      user: {
        id: new TextEncoder().encode(String(memberId)),
        name: memberName,
        displayName: memberName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });

  const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(credential.response.getPublicKey())));
  return { credentialId, publicKey };
}

export async function authenticateBiometric(credentialIdB64) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credentialId = Uint8Array.from(atob(credentialIdB64), c => c.charCodeAt(0));

  try {
    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: credentialId,
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return true;
  } catch {
    return false;
  }
}

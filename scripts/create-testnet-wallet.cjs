// Generates a secp256k1 wallet locally. The private key is written only to .env;
// stdout contains the public address only. Never commit or share .env.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// Legacy Keccak-256, as used by Ethereum addresses (distinct from standardized SHA3-256).
const RC=[1n,0x8082n,0x800000000000808an,0x8000000080008000n,0x808bn,0x80000001n,0x8000000080008081n,0x8000000000008009n,0x8an,0x88n,0x80008009n,0x8000000an,0x8000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,0x800an,0x800000008000000an,0x8000000080008081n,0x8000000000008080n,0x80000001n,0x8000000080008008n];
const ROT=[0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14], MASK=(1n<<64n)-1n;
function keccak256(input){const rate=136,padded=Buffer.alloc(rate);input.copy(padded);padded[input.length]=1;padded[rate-1]|=128;const s=Array(25).fill(0n);for(let i=0;i<rate;i++)s[i>>3]^=BigInt(padded[i])<<BigInt((i%8)*8);for(const rc of RC){const c=Array(5),d=Array(5);for(let x=0;x<5;x++)c[x]=s[x]^s[x+5]^s[x+10]^s[x+15]^s[x+20];for(let x=0;x<5;x++)d[x]=c[(x+4)%5]^((c[(x+1)%5]<<1n|c[(x+1)%5]>>63n)&MASK);for(let y=0;y<5;y++)for(let x=0;x<5;x++)s[x+5*y]^=d[x];const b=Array(25).fill(0n);for(let y=0;y<5;y++)for(let x=0;x<5;x++){const i=x+5*y,r=ROT[i],v=s[i];b[y+5*((2*x+3*y)%5)]=r===0?v:(v<<BigInt(r)|v>>BigInt(64-r))&MASK;}for(let y=0;y<5;y++)for(let x=0;x<5;x++)s[x+5*y]=b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]);s[0]^=rc;}const out=Buffer.alloc(32);for(let i=0;i<32;i++)out[i]=Number(s[i>>3]>>BigInt((i%8)*8)&255n);return out;}

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  const existing = fs.readFileSync(envPath, "utf8");
  if (/^\s*DEPLOYER_PRIVATE_KEY\s*=\s*\S+/m.test(existing)) {
    console.error("A deployer key is already configured in .env. Refusing to overwrite it.");
    process.exit(1);
  }
}

const ecdh = crypto.createECDH("secp256k1");
ecdh.generateKeys();
const privateKey = ecdh.getPrivateKey();
const publicKey = ecdh.getPublicKey(null, "uncompressed").subarray(1);
const address = `0x${keccak256(publicKey).toString("hex").slice(-40)}`;

const previous = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").replace(/\s+$/, "") : "";
const lines = previous ? [previous] : ["BOT_TESTNET_RPC=https://rpc.bohr.life", "BOT_MAINNET_RPC=https://rpc.botchain.ai"];
lines.push(`DEPLOYER_PRIVATE_KEY=0x${privateKey.toString("hex")}`, `DEPLOYER_ADDRESS=${address}`);
const content = `${lines.join("\n")}\n`;
try {
  fs.writeFileSync(envPath, content, { flag: "w", mode: 0o600 });
  if (process.platform === "win32") {
    const { execFileSync } = require("node:child_process");
    execFileSync("icacls", [envPath, "/inheritance:r", "/grant:r", `${process.env.USERNAME}:(F)`], { stdio: "ignore" });
  }
} catch (error) {
  console.error(`Could not securely save .env: ${error.message}`);
  privateKey.fill(0);
  process.exit(1);
}
privateKey.fill(0);
console.log(`Testnet deployer address: ${address}`);
console.log(`Private key saved locally to ${envPath}; it was not printed.`);
console.log("Fund only with BOT testnet funds. Never reuse this wallet or key on mainnet.");
console.log("After funding, run: npm run check:testnet");
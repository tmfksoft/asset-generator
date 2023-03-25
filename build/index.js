"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const crypto_1 = __importDefault(require("crypto"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
class AssetGenerator {
    constructor() {
        this.program = new commander_1.Command();
        this.program
            .name("asset-generator")
            .description("Generates an asset manifest and duplicates a folder structure into an uploadable one.")
            .version("1.0.0");
        this.program
            .command("generate-manifest")
            .description("Generates the manifest file for the source directory.")
            .argument("<manifest>", "Manifest output filename")
            .argument("<directory>", "Source Directory")
            .option("--overwrite", "Overwrite manifest file and merge directory if they already exist.", false)
            .action(this.generateManifest.bind(this));
        this.program
            .command("generate-structure")
            .description("Copies the source directory into the asset upload structure")
            .argument("<sourceDir>", "Source Directory")
            .argument("<destinationDir>", "Destination Directory")
            .option("--overwrite", "Overwrite manifest file and merge directory if they already exist.", false)
            .action(this.generateStructure.bind(this));
        this.program
            .command("generate")
            .description("Generates a manifest file for a source directory and copies it into an uploadable structure")
            .argument("<manifest>", "Manifest output filename")
            .argument("<sourceDir>", "Source Directory")
            .argument("<destinationDir>", "Destination Directory")
            .option("--overwrite", "Overwrite manifest file and merge directory if they already exist.", false)
            .action(this.generateAll.bind(this));
        this.program.parse();
    }
    generateAll(manifestPath, sourceDir, destinationDir, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetList = yield this.generateFileList(sourceDir);
            if (!fs.existsSync(manifestPath) && !options.overwrite) {
                throw new Error("Manifest file already exists!");
            }
            fs.writeFileSync(manifestPath, JSON.stringify(assetList));
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir);
            }
            else if (!options.overwrite) {
                throw new Error("Destination already exists!");
            }
            for (let file of assetList) {
                const hashStart = file.hash.substring(0, 2);
                const fileDir = path_1.default.join(destinationDir, hashStart);
                const sourcePath = path_1.default.join(sourceDir, file.path);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir);
                }
                const destinationPath = path_1.default.join(fileDir, file.hash);
                console.log(`Copying: ${sourcePath}`);
                fs.copyFileSync(sourcePath, destinationPath);
            }
        });
    }
    generateManifest(manifestPath, sourceDir, options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Generating Manifest`);
            if (fs.existsSync(manifestPath) && !options.overwrite) {
                throw new Error("Manifest already exists!");
            }
            const assetList = yield this.generateFileList(sourceDir);
            fs.writeFileSync(manifestPath, JSON.stringify(assetList));
        });
    }
    generateStructure(sourceDir, destinationDir, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileList = yield this.generateFileList(sourceDir);
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir);
            }
            else if (!options.overwrite) {
                throw new Error("Destination already exists!");
            }
            for (let file of fileList) {
                const hashStart = file.hash.substring(0, 2);
                const fileDir = path_1.default.join(destinationDir, hashStart);
                const sourcePath = path_1.default.join(sourceDir, file.path);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir);
                }
                const destinationPath = path_1.default.join(fileDir, file.hash);
                console.log(`Copying: ${sourcePath}`);
                fs.copyFileSync(sourcePath, destinationPath);
            }
        });
    }
    generateFileList(sourceDir, directoryPrefix = "") {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Reading: ${sourceDir}`);
            if (!fs.existsSync(sourceDir)) {
                return [];
            }
            const fileList = [];
            const directoryContents = fs.readdirSync(sourceDir);
            for (let element of directoryContents) {
                const fullPath = path_1.default.join(sourceDir, element);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    const recursedFiles = yield this.generateFileList(fullPath, path_1.default.join(directoryPrefix, element));
                    for (let f of recursedFiles) {
                        fileList.push(f);
                    }
                    continue;
                }
                const hash = yield this.generateHash(fullPath);
                fileList.push({
                    path: path_1.default.join(directoryPrefix, element),
                    hash,
                    size: stat.size
                });
            }
            return fileList;
        });
    }
    generateHash(sourceFile) {
        if (!fs.existsSync(sourceFile)) {
            throw new Error("File does not exist!");
        }
        const hash = crypto_1.default.createHash("sha1");
        const fd = fs.createReadStream(sourceFile);
        return new Promise((resolve, reject) => {
            fd.pipe(hash);
            fd.on('end', () => {
                const hex = hash.digest("hex");
                resolve(hex);
            });
            fd.on('error', (e) => {
                reject(e);
            });
        });
    }
}
const generator = new AssetGenerator();

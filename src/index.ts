import { Command } from 'commander';
import Crypto from 'crypto';
import * as fs from 'fs';
import path from 'path';
import AssetEntry from './interfaces/AssetEntry';

class AssetGenerator {
	public program: Command = new Command();

	constructor() {
		this.program
			.name("asset-generator")
			.description("Generates an asset manifest and duplicates a folder structure into an uploadable one.")
			.version("1.0.5")

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
			.action(this.generateAll.bind(this))

		this.program.parse();
	}

	async generateAll(manifestPath: string, sourceDir: string, destinationDir: string, options: { overwrite: boolean }) {

		const assetList = await this.generateFileList(sourceDir);

		if (fs.existsSync(manifestPath) && !options.overwrite) {
			throw new Error("Manifest file already exists!");
		}
		fs.writeFileSync(manifestPath, JSON.stringify(assetList));
		
		
		if (!fs.existsSync(destinationDir)) {
			fs.mkdirSync(destinationDir);
		} else if (!options.overwrite) {
			throw new Error("Destination already exists!");
		}

		for (let file of assetList) {
			const hashStart = file.hash.substring(0, 2);
			const fileDir = path.join(destinationDir, hashStart);
			const sourcePath = path.join(sourceDir, file.path);

			if (!fs.existsSync(fileDir)) {
				fs.mkdirSync(fileDir);
			}

			const destinationPath = path.join(fileDir, file.hash);
			console.log(`Copying: ${sourcePath}`);
			fs.copyFileSync(sourcePath, destinationPath);
		}
	}

	async generateManifest(manifestPath: string, sourceDir: string, options: { overwrite: boolean }): Promise<void> {
		console.log(`Generating Manifest`);
		if (fs.existsSync(manifestPath) && !options.overwrite) {
			throw new Error("Manifest already exists!");
		}
		const assetList = await this.generateFileList(sourceDir);
		fs.writeFileSync(manifestPath, JSON.stringify(assetList));
	}
	async generateStructure(sourceDir: string, destinationDir: string, options: { overwrite: boolean }): Promise<void> {
		const fileList = await this.generateFileList(sourceDir);
		if (!fs.existsSync(destinationDir)) {
			fs.mkdirSync(destinationDir);
		} else if (!options.overwrite) {
			throw new Error("Destination already exists!");
		}

		for (let file of fileList) {
			const hashStart = file.hash.substring(0, 2);
			const fileDir = path.join(destinationDir, hashStart);
			const sourcePath = path.join(sourceDir, file.path);

			if (!fs.existsSync(fileDir)) {
				fs.mkdirSync(fileDir);
			}

			const destinationPath = path.join(fileDir, file.hash);
			console.log(`Copying: ${sourcePath}`);
			fs.copyFileSync(sourcePath, destinationPath);
		}
	}

	async generateFileList(sourceDir: string, directoryPrefix: string = ""): Promise<AssetEntry[]> {
		console.log(`Reading: ${sourceDir}`);
		if (!fs.existsSync(sourceDir)) {
			return [];
		}
		const fileList: AssetEntry[] = [];
		const directoryContents = fs.readdirSync(sourceDir);
		for (let element of directoryContents) {
			const fullPath = path.posix.join(sourceDir, element);
			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				const recursedFiles = await this.generateFileList(fullPath, path.posix.join(directoryPrefix, element));
				for (let f of recursedFiles) {
					fileList.push(f);
				}
				continue;
			}
			const hash = await this.generateHash(fullPath);
			fileList.push({
				path: path.posix.join(directoryPrefix, element),
				hash,
				size: stat.size
			});
		}
		return fileList;
	}

	generateHash(sourceFile: string): Promise<string> {
		if (!fs.existsSync(sourceFile)) {
			throw new Error("File does not exist!");
		}
		const hash = Crypto.createHash("sha1");
		const fd = fs.createReadStream(sourceFile);

		return new Promise((resolve, reject) => {
			fd.pipe(hash);
			fd.on('end', () => {
				const hex = hash.digest("hex");
				resolve(hex);
			});
			fd.on('error', (e) => {
				reject(e);
			})
		});
	}
}
const generator = new AssetGenerator();
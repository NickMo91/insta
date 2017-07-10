const Sequelize = require("sequelize");
const sql = require("../util/sql");
const fs = require("fs");

const File = sql.define("file", {
	id: {
		type: Sequelize.STRING,
		primaryKey: true,
	},
	size: {
		type: Sequelize.INTEGER,
		notNull: true,
	},
	originalName: {
		type: Sequelize.STRING,
		notNull: true,
	},
	mimeType: {
		type: Sequelize.STRING,
		notNull: true,
	},
});

File.prototype.getThumbnailSrc = function(file) {
	if (fs.existsSync("assets/thumbnails/" + this.get("id") + ".jpg")) {
		return "/thumbnails/" + this.get("id") + ".jpg";
	}
	else {
		return "/icons/file.svg";
	}
};

File.prototype.getPreviewSrc = function(file) {
	if (fs.existsSync("assets/previews/" + this.get("id") + ".jpg")) {
		return "/previews/" + this.get("id") + ".jpg";
	}
	else {
	// Check if I have a preview available in assets/previews!
	// Otherwise return null, to display a "no preview" message
		return null;
	}
};

module.exports = File;

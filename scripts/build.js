const fse = require("fs-extra");
const { join } = require("path");
const parseMD = require("parse-md").default;

const { TwingEnvironment, TwingLoaderFilesystem } = require("twing");

const loader = new TwingLoaderFilesystem("./src/templates");
const environment = new TwingEnvironment(loader);

const storiesBySlug = fse
  .readdirSync("./content/stories")
  .map((filename) => {
    const [slug, lang, ext] = filename.split(".");

    if (ext === "md" && lang && slug) {
      const { metadata, content } = parseMD(
        fse.readFileSync(join("content", "stories", filename), "utf-8")
      );
      return {
        filename,
        ...metadata,
        slug,
        lang,
        content,
      };
    }

    return null;
  })
  .filter((el) => el != null)
  .reduce(function(r, a) {
    r[a.slug] = r[a.slug] || [];
    r[a.slug].push(a);
    return r;
  }, {});

const stories = Object.values(storiesBySlug);

var data = { stories }; // put your data here.

const pages = fse.readdirSync("./src/templates/pages");

pages.forEach((filename) => {
  if (filename.includes(".single")) return;

  environment.render(join("pages", filename), data).then((output) => {
    fse.outputFile(
      join("build", filename.replace(".twig", ".html")),
      output,
      "utf8"
    );
  });
});

stories.forEach((langStories) => {
  langStories.forEach((story) => {
    environment
      .render(join("pages", "story.single.twig"), { story, langStories })
      .then((output) => {
        fse.outputFile(
          join("build", "stories", story.lang, story.slug + ".html"),
          output,
          "utf8"
        );
      });
  });
});

fse.copy("./admin", "./build/admin");
fse.copy("./assets", "./build/assets");

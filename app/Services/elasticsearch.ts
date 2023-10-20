
//  const ELASTICSEARCH_CONNECTION = Env.get("ELASTICSEARCH_CONNECTION");

const { Client } = require('@elastic/elasticsearch');
const Env = require("@ioc:Adonis/Core/Env");

const ELASTICSEARCH_HOST = Env.get("ELASTICSEARCH_HOST");
const ELASTICSEARCH_PORT = Env.get("ELASTICSEARCH_PORT");

export const esClient = async () => {
    try {
        const esClient = new Client({ node: `${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}` });
        debugger
        return esClient;
    } catch (error) {
        console.log("The ASTRAPAY API response error: @ esClient line 16 ");
        console.error(error.message);
        debugger
    }
};

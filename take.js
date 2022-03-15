const crmodel = global.get("crmodel");
const crUtils = global.get("crUtils");
const crCache = crUtils.crCache;
const sequelize = crmodel.sequelize;
const crsequelize = global.get("crsequelize").Sequelize;
let seq = global.get("crsequelize")

// node.error([sequelize]);
// node.error([await crmodel.getModel("pm", "variantActivity")]);
// let data = await sequelize.query("select * from variantActivity")

// node.error(["data",data]);


function listToStr(list = [], splitStr = ",") {
    let str1 = ""
    for (let i = 0; i < list.length; i++) {
        if (i === list.length - 1) {
            str1 = str1 + list[i]
            break
        }
        str1 += list[i] + splitStr
    }
    return str1
}

function pathsNamesToStr(paths) {
    let str2 = ""
    for (let i = 0; i < paths.length; i++) {
        let str1 = listToStr(paths[i])
        paths[i] = str1
        if (!str2 && str1) {
            str2 += str1
            continue
        }
        if (str1) {
            str2 = str2 + "," + str1
        }
    }
    return str2
}

async function getTableName(app, model) {
    let m = await crmodel.parseModel(app, model);
    return await crUtils.getModelName(m.appId, m.modelId);
}

async function getWithPath(flowCode, paths) {
    let pathStr = await pathsNamesToStr(paths);
    let tableName = await getTableName("pm", "variantActivity")
    let flowVariantColumn = await crmodel.getFieldId("pm", "variantActivity", "flowVariant");
    let flowCodeColumn = await crmodel.getFieldId("pm", "variantActivity", "flowCode");
    let activityColumn = await crmodel.getFieldId("pm", "variantActivity", "activity");
    let sequenceColumn = await crmodel.getFieldId("pm", "variantActivity", "sequence");

    let sql = `
    SELECT * FROM (
        SELECT u.${flowCodeColumn} as flowCode,u.${flowVariantColumn} as flowVariant, group_concat(u.${activityColumn}) as pathStr
        from (
            select * from ${tableName} order by ${sequenceColumn}
            ) as u
        where u.${flowCodeColumn}=?
        GROUP BY u.${flowCodeColumn} ,u.${flowVariantColumn}
        ) AS T
        where T.pathStr IN(?)
    `

    // node.error([tableName, flowCodeColumn, sql, paths]);

    let options = {
        replacements: [flowCode, pathStr],
        type: crsequelize.QueryTypes.SELECT
    }
    let data = await sequelize.query(sql, options)
    node.error(["data", data]);

    return data;
}



async function getMaxVariantNameWithSameNumLength(flowCode, numLength) {
    if (numLength <= 0) {
        numLength = 1
    }
    let options = {
        order: [["flowVariant", "DESC"]],
        where: {
            flowCode: flowCode,
            flowVariant: {
                [crmodel.Op.and]: [
                    { [crmodel.Op.regexp]: '^变体[0-9]{' + numLength + '}$' },
                    // crsequelize.where(crsequelize.fn('char_length', 3))
                ]
            }

            // flowVariant: {[crmodel.Op.gt]: "变体10"}
        }
        // where: crsequelize.where(crsequelize.fn('char_length', crsequelize.col('flowVariant')), 3)
    }
    return await crmodel.findOne("pm", "flowVariant", options)
}

async function getMaxVariantName(flowCode) {
    let options = { offset: 0, limit: 1 }
    let result = await crmodel._findAndCountAll("pm", "flowVariant", options);
    let count = result.count;
    let index = Math.floor(JSON.stringify(count).length)
    let data = await getMaxVariantNameWithSameNumLength(flowCode, index);
    let maxName = null;
    if (data) {
        while (data) {
            maxName = data.flowVariant
            data = await getMaxVariantNameWithSameNumLength(flowCode, ++index);
        }
    } else {
        while (index > 0 && !data) {
            data = await getMaxVariantNameWithSameNumLength(flowCode, --index);
            maxName = data.flowVariant
        }
    }

    index = 0
    if (maxName) {
        index = parseInt(maxName.split("变体")[1]);
    }

    // node.error(["getMaxVariantName", data, result, index, maxName]);
    return index;
}




async function getVariant(flowCode, flowVariants) {
    let options = {
        where: {
            flowCode: flowCode,
        }
    }
    if (flowVariants) {
        options.where.flowVariant = { [crmodel.Op.in]: flowVariants }
    }
    let data = await crmodel.findAll("pm", "flowVariant", options);
    node.error(["getVariant", data]);
    return data;
}

async function getCase(flowCode, flowCases) {
    let options = {
        where: {
            flowCode: flowCode,
        }
    }
    if (flowCases) {
        options.where.flowCase = { [crmodel.Op.in]: flowCases }
    }
    let data = await crmodel.findAll("pm", "variantCase", options);
    node.error(["old case", data]);
    return data;
}

async function getOldActivities(flowCode) {
    let activities = []
    let data = await crmodel.findAll("pm", "flowActivity", { flowCode: flowCode });
    for (let i = 0; i < data.length; i++) {
        activities.push(data[i].activity);
    }
    node.error(["已经存在的活动", activities]);
}

// 迭代器查询数据
async function findAndCountAllIter(app, model, options, pageSize) {
    if (pageSize <= 0) {
        pageSize = 10;
    }
    let options_ = options || {};
    options_.limit = 0;
    let result = await crmodel._findAndCountAll(app, model, options_);
    let count = result.count;
    return {
        [Symbol.iterator]: function* () {
            let i = 0;
            while (i * pageSize < count) {
                delete options_["offset"];
                delete options_["limit"];
                // options_.skip = i * pageSize;
                // options_.limit = pageSize;
                yield crmodel.findAll(app, model, { ...options_, offset: i * pageSize, limit: (i + 1) * pageSize });
                i = i + 1;

            }
        }
    };
}


// 查询测试
async function findAllTest(flowCode) {
    let l = await findAndCountAllIter(
        "pm", "variantActivity", {
            // order: [["sequence"]],
            where: { flowCode: flowCode },
        },
        1000,
    )
    for (const iterator of l) {
        node.error(["查询测试 iterator", await iterator]);
    }
    node.error(["查询测试 迭代器", l]);
}





async function main() {
    let flowCode = "p2p"
    // await getOldVariant(flowCode);
    // await findAllTest(flowCode);
    // await getOldActivities(flowCode);
    // await getCase(flowCode, ["PO202109160109"]);
    // await getVariant(flowCode);
    // await getMaxVariantName(flowCode);
    // await getPath(flowCode, [[
    //     "订单创建",
    //     // "归档审批通过",
    //     // "", "",
    //     // "已收货"
    // ]]);
    await modelTest();
    await getWithPath(flowCode, [[
        "订单创建",
        "归档审批通过",
        // "", "",
        "已收货"
    ]]);

    // await se();
}


await main();

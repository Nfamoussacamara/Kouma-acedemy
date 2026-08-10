export const createSearchFilter = (search, fields = []) => {

    if (!search || !fields.length) {
        return {};
    }
    return {
        $or: fields.map((field) => ({
            [field]: {
                $regex: search,
                $options: "i"
            }
        }))
    };

};
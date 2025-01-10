import React, { FunctionComponent, useState, useEffect } from "react";
import {
  Flex,
  FlexItem,
  Box,
  Button,
  Panel,
  Chip,
  Table,
  TableItem,
  Text,
  Dropdown,
  ProgressCircle,
  Input,
  Form,
  FormGroup,
  Grid,
  Modal,
} from "@bigcommerce/big-design";
import { InfoIllustration } from "bigcommerce-design-patterns";
import {
  AddIcon,
  CloseIcon,
  FilterListIcon,
  MoreHorizIcon,
  RemoveCircleOutlineIcon,
  SearchIcon,
} from "@bigcommerce/big-design-icons";
import { Header, Page } from "@bigcommerce/big-design-patterns";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import { theme } from "@bigcommerce/big-design-theme";
import {
  StyledFiltersLink,
  StyledPanelContents,
  StyledProductImage,
  StyledModalContents,
} from "./FiltersAdvancedAdditivePage.styled";

import { DummyItem } from "../../data/dummyProducts";
import { getCategories, getProducts } from "../../data/services";
import { Category } from "../../data/dummyCategories";
import { findCategoryById } from "../../helpers/categories";
import { formatPrice } from "../../helpers/price";
import { FilterRow } from "./FilterRow";

/**
 * Mock data for the items to be displayed in the table.
 */
interface Item extends DummyItem, TableItem {}

interface Filter {
  logicalOperator: string;
  field: string;
  comparisonOperator: string;
  value: string | number | undefined;
}

/**
 * Column definitions for the table.
 */

/**
 * Function to sort the items based on a column and direction.
 * @param {Item[]} items - The items to sort.
 * @param {string} columnHash - The column to sort by.
 * @param {string} direction - The direction to sort (ASC or DESC).
 * @returns {Item[]} - The sorted items.
 */
const sort = (items: Item[], columnHash: string, direction: string) => {
  return items
    .concat()
    .sort((a, b) =>
      direction === "ASC"
        ? a[columnHash] >= b[columnHash]
          ? 1
          : -1
        : a[columnHash] <= b[columnHash]
        ? 1
        : -1
    );
};

/**
 * PageList component - Displays a page with a list of items in a table.
 */
const PageFiltersAdvancedAdditive: FunctionComponent = () => {
  // NAVIGATION
  const location = useLocation();

  const navigate = useNavigate();

  // TABLE HEADERS
  const columns = [
    {
      header: "Name",
      hash: "name",
      render: ({ name, image }: { name: string; image: string }) => {
        const imgSrc = `./assets/images/product-images/${image}`;
        return (
          <Flex flexGap={theme.spacing.small} alignItems="center">
            <StyledProductImage>
              <img src={imgSrc} alt={name} />
            </StyledProductImage>
            <Text>{name}</Text>
          </Flex>
        );
      },
      isSortable: true,
    },
    {
      header: "Sku",
      hash: "sku",
      render: ({ sku }: { sku: string }) => sku,
      isSortable: true,
    },
    {
      header: "Categories",
      hash: "categories",
      render: ({ categories }: { categories: number[] }) => {
        // get category labels from a deep object and join them
        return categories
          .map((categoryId) => {
            const category = findCategoryById(productCats, categoryId);
            return category ? category.label : "";
          })
          .join(", ");
      },
    },
    {
      header: "Stock",
      hash: "stock",
      render: ({ stock }: { stock: number }) => stock,
      isSortable: true,
    },
    {
      header: "Price",
      hash: "price",
      render: ({ price }: { price: number }) => formatPrice(price),
      isSortable: true,
    },
    {
      header: null,
      hash: "actions",
      render: ({ productId, url }: { productId: number; url: string }) => {
        return (
          <Dropdown
            items={[
              {
                content: "Some action",
                onItemClick: () => {
                  return null;
                },
                hash: "edsome-action",
              },
              {
                content: "Some other action",
                onItemClick: () => {
                  return null;
                },
                hash: "some-other-action",
              },
            ]}
            maxHeight={250}
            placement="bottom-end"
            toggle={
              <Button variant="utility" iconOnly={<MoreHorizIcon />}></Button>
            }
          />
        );
      },
      isSortable: true,
    },
  ];

  // DATA HANDLING
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);

  const setTableItems = (
    themItems: any,
    thePage = currentPage,
    itemCount = itemsPerPage
  ) => {
    const maxItems = thePage * itemCount;
    const lastItem = Math.min(maxItems, themItems.length);
    const firstItem = Math.max(0, maxItems - itemsPerPage);

    setCurrentItems(themItems.slice(firstItem, lastItem));
  };

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([10, 20, 30]);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const onItemsPerPageChange = (newRange: number) => {
    setCurrentPage(1);
    setItemsPerPage(newRange);
  };

  const onPageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTableItems(items, newPage);
  };

  // SORTING
  const [columnHash, setColumnHash] = useState("");
  const [direction, setDirection] = useState<"ASC" | "DESC">("ASC");
  const onSort = (newColumnHash: string, newDirection: "ASC" | "DESC") => {
    setColumnHash(newColumnHash);
    setDirection(newDirection);
    const orderedItems = sort(items, newColumnHash, newDirection);
    setTableItems(orderedItems);
  };

  // SEARCH
  const [searchValue, setSearchValue] = useState("");
  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    // let's reset the items to the original data if the search value is empty
    if (!event.target.value) {
      setFilterArray(filterArray);
    }
  };
  // search submission handler
  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue) {
      // let's find the items
      setFilterArray(filterArray);
    }
  };

  // EFFECTS

  // fetch categories and product all at once

  const [productCats, setProductCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  useEffect(() => {
    Promise.all([getCategories(), getProducts()]).then(
      ([categories, products]) => {
        setProductCats(categories as Category[]);
        setAllItems(products as Item[]);
        setItems(products as Item[]);
        setTableItems(products as Item[]);
        setItemsLoaded(true);
      }
    );
  }, []);

  // PAGE ELEMENTS

  // FILTERING MODAL
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filterArray, setFilterArray] = useState<Filter[]>([]);
  useEffect(() => {
    let filteredItems = [...allItems];

    // lets include search
    if (searchValue) {
      filteredItems = filteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    const filterfunction = (baseArray, filter) => {
      return baseArray.filter((item) => {
        // let's switch through the comparison operators
        switch (filter.comparisonOperator) {
          case "=":
            return item[filter.field] == filter.value;
          case "!=":
            // here we could be either looking at an array or a single value
            return item[filter.field] != filter.value;
          case ">":
            return item[filter.field] > filter.value;
          case "<":
            return item[filter.field] < filter.value;
          case "contains":
            return item[filter.field].includes(filter.value);
          case "excludes":
            return !item[filter.field].includes(filter.value);
          default:
            return false;
        }
      });
    };
    filterArray.forEach((filter) => {
      // let's start by analyzing the logical operator
      if (filter.logicalOperator === "where") {
        // this is the first filter, so we start from here
        filteredItems = filterfunction(filteredItems, filter);
      } else if (filter.logicalOperator === "and") {
        // we add the filter to the current filtered items
        filteredItems = filterfunction(filteredItems, filter);
      } else {
        // this would be "or" logical operator, so we need to merge the current filtered items with the new filter
        const newFilteredItems = filterfunction(allItems, filter);
        filteredItems = [...filteredItems, ...newFilteredItems];
      }
    });

    setItems(filteredItems as Item[]);
    setTableItems(filteredItems);
  }, [filterArray]);

  const applyFilters = () => {
    // set the filter Array to the modal filter array
    setFilterArray(modalFilterArray);

    // close the modal
    closeFilterModal();
  };

  const clearAllFilters = (e) => {
    e && e.preventDefault();
    setFilterArray([]);
  };

  const openFilterModal = (e) => {
    e.preventDefault();
    // set the modal filter array to the current filter array
    const modalFilters =
      filterArray.length > 0
        ? filterArray
        : [
            {
              logicalOperator: "where",
              field: "categories",
              comparisonOperator: "contains",
              value: undefined,
            },
          ];
    setModalFilterArray(modalFilters);
    setIsFilterModalOpen(true);
  };
  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // temporaty state for filters in modal
  const [modalFilterArray, setModalFilterArray] = useState<Filter[]>([]);
  const addFilterRow = (e) => {
    e.preventDefault();
    const newFilterArray = [...modalFilterArray];
    newFilterArray.push({
      logicalOperator: "or",
      field: "categories",
      comparisonOperator: "contains",
      value: undefined,
    });
    setModalFilterArray(newFilterArray);
  };

  const deleteFilterRow = (index) => {
    setModalFilterArray((prevFilterArray) => {
      const updatedFilterArray = prevFilterArray.filter((_, i) => i !== index);
      return updatedFilterArray;
    });
  };

  const updateModalFilters = (filter) => {
    setModalFilterArray((prevFilterArray) => {
      const updatedFilterArray = prevFilterArray.map((prevFilter, i) => {
        if (i === filter.index) {
          return filter;
        }
        return prevFilter;
      });
      return updatedFilterArray;
    });
  };

  const deleteChip = (index) => {
    setFilterArray((prevFilterArray) => {
      const updatedFilterArray = prevFilterArray.filter((_, i) => i !== index);
      return updatedFilterArray;
    });
  };

  const filterBuilder = (
    <StyledModalContents>
      {modalFilterArray.map((filter, index) => (
        <Grid
          gridColumns="1fr 32px"
          gridGap="0.25rem"
          key={index}
          borderBottom="box"
          paddingVertical={"xSmall"}
          paddingHorizontal={"xLarge"}
        >
          <FilterRow
            index={index}
            filter={filter}
            onChange={(value) => {
              updateModalFilters(value);
            }}
            productCats={productCats}
          />
          {/* add or delete button */}
          <Button
            variant="utility"
            onClick={() => {
              deleteFilterRow(index);
            }}
            iconOnly={<RemoveCircleOutlineIcon />}
            disabled={filterArray.length === 1}
          />
        </Grid>
      ))}
      <Box paddingVertical="medium" paddingHorizontal="xLarge">
        <Button
          variant="secondary"
          onClick={addFilterRow}
          iconLeft={<AddIcon />}
        >
          Add
        </Button>
      </Box>
    </StyledModalContents>
  );

  // Empty state
  const EmptyState = (
    <Flex
      justifyContent="center"
      paddingVertical="xxxLarge"
      marginBottom="xxxLarge"
    >
      {items.length < 1 && !itemsLoaded ? (
        // if products havent been loaded, let's show a loader
        <ProgressCircle size="large" />
      ) : (
        // if products have been loaded, let's show the empty
        <InfoIllustration icon="empty">
          <Text color="secondary60">
            {
              // differentiate from empty search or empty products and show a loader element if the data is being fetched
              filterArray.length > 0
                ? `No products were found for the criteria`
                : "You have no products yet."
            }
          </Text>
        </InfoIllustration>
      )}
    </Flex>
  );

  return (
    <>
      <Page
        header={
          <Header
            description="To be used wen you want to configure filters very precisely in additive mode and save teh views for later use."
            title="Advanced additive filters with views"
            backLink={{
              text: "Back to patterns",
              onClick: () => navigate("/"),
              href: "#",
            }}
          />
        }
      >
        <Flex flexDirection="column" flexGap={theme.spacing.xLarge}>
          <FlexItem>
            {
              //The most common way of organizing information within the BigDesign patterns is with the use of panels.
              //In this case we only have one panel, but you can have multiple panels within a page.
            }
            <Panel header="Items list">
              {
                //search and filtering
              }
              <Box marginBottom="medium">
                <Grid gridColumns="1fr 100px" gridGap="1rem">
                  <Form fullWidth onSubmit={onSearchSubmit}>
                    <FormGroup>
                      <Input
                        placeholder="Search"
                        value={searchValue}
                        onChange={onSearchChange}
                        iconLeft={<SearchIcon color="secondary50" />}
                      />
                    </FormGroup>
                  </Form>
                  <Button
                    variant="secondary"
                    onClick={openFilterModal}
                    iconLeft={<FilterListIcon />}
                  >
                    Filter
                  </Button>
                </Grid>
              </Box>
              {filterArray.length > 0 && (
                <Flex
                  flexDirection={{ mobile: "row" }}
                  display={"inline-flex"}
                  flexWrap={"wrap"}
                  marginBottom="medium"
                  alignItems={"center"}
                >
                  {/* let's showcase the filters applied with chips here*/}
                  {filterArray.map((filter: Filter, index) => {
                    const filterFieldCapitalized =
                      filter.field.charAt(0).toUpperCase() +
                      filter.field.slice(1);
                    const filterLogicalOperatorUppercase =
                      filter.logicalOperator.toUpperCase();
                    if (filter.field === "categories") {
                      const cat =
                        filter.value !== undefined
                          ? findCategoryById(productCats, Number(filter.value))
                          : undefined;
                      return (
                        <Chip
                          key={filter.value}
                          onDelete={() => {
                            deleteChip(index);
                          }}
                          label={`${
                            filter.logicalOperator !== "where"
                              ? filterLogicalOperatorUppercase
                              : ""
                          } ${filterFieldCapitalized} ${
                            filter.comparisonOperator
                          } ${cat?.label}`}
                        />
                      );
                    }
                    return (
                      <Chip
                        key={index}
                        onDelete={() => {
                          deleteChip(index);
                        }}
                        label={`${
                          filter.logicalOperator !== "where"
                            ? filterLogicalOperatorUppercase
                            : ""
                        } ${filterFieldCapitalized} ${
                          filter.comparisonOperator
                        } ${filter.value}`}
                      />
                    );
                  })}
                  {filterArray.length > 0 && (
                    <StyledFiltersLink href="#" onClick={clearAllFilters}>
                      <CloseIcon />
                      <span>Clear all filters</span>
                    </StyledFiltersLink>
                  )}
                </Flex>
              )}
              <StyledPanelContents>
                {
                  //The Table component is used to display tabular data.
                  //It allows you to display a list of items in a table format.
                  //The table can be customized with different columns and actions.
                  //The table also allows you to select items and perform actions on them.
                  //In this case, the table is displaying a list of products.
                }
                <Table
                  columns={columns as any}
                  itemName="Products"
                  items={currentItems}
                  keyField="sku"
                  pagination={{
                    currentPage,
                    totalItems: items.length,
                    onPageChange,
                    itemsPerPageOptions,
                    onItemsPerPageChange,
                    itemsPerPage,
                  }}
                  sortable={{
                    columnHash,
                    direction,
                    onSort,
                  }}
                  emptyComponent={EmptyState}
                />
              </StyledPanelContents>
            </Panel>
          </FlexItem>
        </Flex>
        <Modal
          actions={[
            { text: "Cancel", variant: "subtle", onClick: closeFilterModal },
            { text: "Apply", variant: "primary", onClick: applyFilters },
          ]}
          closeOnEscKey={true}
          header="Filter products"
          onClose={closeFilterModal}
          isOpen={isFilterModalOpen}
        >
          {filterBuilder}
        </Modal>
      </Page>
    </>
  );
};

export default PageFiltersAdvancedAdditive;

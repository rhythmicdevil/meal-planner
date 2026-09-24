package com.rhythmicdevil.menu_planner.staplegroup;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "staple_group")
public class StapleGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @OneToMany(mappedBy = "stapleGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StapleItem> items = new ArrayList<>();

    protected StapleGroup() {
    }

    public StapleGroup(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<StapleItem> getItems() {
        return items;
    }

    public void replaceItems(List<StapleItem> newItems) {
        items.clear();
        for (StapleItem item : newItems) {
            item.setStapleGroup(this);
            items.add(item);
        }
    }
}
